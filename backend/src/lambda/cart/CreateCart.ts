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

  console.log("Adding a cart called " + cart.name)

  if ( cart.name && cart.name != "" && cart.ownerid && cart.ownerid != "") {
    const existing = await cartDBHelper.getCart(cart.name, cart.ownerid)
    if (! existing) {
        if (await cartDBHelper.createCart(cart)) {
            returnCode = 201;
            body = JSON.stringify({
                "identifier": cart.identifier
            })
        }
    }
    else {
        console.error("Cart already exists: " + JSON.stringify(existing))
        returnCode = 401
        body = JSON.stringify({ "Error": "Cart " + cart.name +
            " from owner " + cart.ownerid + " already exists" });
    }
  } else {
    returnCode = 400
    body = JSON.stringify({ "Error": "Invalid Request (no valid name or groupid)" });
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
