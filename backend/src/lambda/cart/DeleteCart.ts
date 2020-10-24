import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'
import { ICartEntry } from '../../backendInterface/CartDBHelper'

const cartDBHelper = backendFactory.getCartDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const cart = JSON.parse(event.body) as ICartEntry
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Deleting a cart " + cart.identifier)

  if ( cart.identifier && cart.identifier != "") {

    const success = await cartDBHelper.deleteCart(cart.identifier)
    if ( success ) {
        returnCode = 200;
        body = JSON.stringify({
            "identifier": cart.identifier
        })
    }
    else {
        console.error("Cart removal failed!")
        returnCode = 401
        body = JSON.stringify({ "Error": "Removal failed" });
    }
  } else {
    returnCode = 400
    body = JSON.stringify({ "Error": "Invalid Request (no valid owner or identifier)" });
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