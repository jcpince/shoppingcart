import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'

const cartDBHelper = backendFactory.getCartDBHelper();

export const handler: APIGatewayProxyHandler =
    async (): Promise<APIGatewayProxyResult> => {

    var returnCode = 500;
    var body = JSON.stringify({ "Error": "Server failure" });

    console.log("Removing all the carts!!!!")

    /*if (! process.env.IS_OFFLINE) {
        returnCode = 400;
        body = JSON.stringify({ "Error": "Operation not authorized" });
    } else*/ {
        if (await cartDBHelper.clearCarts()) {
            returnCode = 200;
            body = JSON.stringify({ "Status": "Succeeded" });
        }
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
