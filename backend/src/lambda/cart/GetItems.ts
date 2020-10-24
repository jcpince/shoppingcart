import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'

const cartDBHelper = backendFactory.getCartDBHelper();

export const handler: APIGatewayProxyHandler =
async (event: APIGatewayProxyEvent):
Promise<APIGatewayProxyResult> => {

    const cartid = event.pathParameters.cartid
    var returnCode = 500;
    var body = JSON.stringify({ "Error": "Server failure" });

    console.log("Getting all the items of the cart " + cartid)

    /* TODO: Check that the user is in the cart's group
       before getting the items
     */
    if ( cartid != "") {

        const items = await cartDBHelper.getCartItems(cartid)
        if ( items ) {
            returnCode = 200;
            body = JSON.stringify(items)
        }
        else {
            console.error("Cart retrieval failed!")
            returnCode = 401
            body = JSON.stringify({ "Error": "Retrieval failed" });
        }
    } else {
        returnCode = 400
        body = JSON.stringify({ "Error": "Invalid Request (no valid identifier)" });
    }

    return {
        statusCode: returnCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body: body
    }
}
