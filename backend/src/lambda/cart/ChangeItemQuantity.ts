import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'
import { ICartItem } from '../../backendInterface/CartDBHelper'

const cartDBHelper = backendFactory.getCartDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const cart_item = JSON.parse(event.body) as ICartItem
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Changing a cart item quantity " +
        JSON.stringify(cart_item))

  if ( cart_item.userid && cart_item.userid != "" &&
        cart_item.identifier && cart_item.identifier != "" &&
        cart_item.itemid && cart_item.itemid != "" &&
        cart_item.cartid && cart_item.cartid != "" &&
        ((cart_item.quantity && cart_item.quantity != 0) ||
            (cart_item.unit && cart_item.unit != "")) ) {

    const success = await cartDBHelper.changeItemQuantity(cart_item)
    if ( success ) {
        returnCode = 200;
        body = JSON.stringify({
            "identifier": cart_item.identifier
        })
    }
    else {
        console.error("Item modification failed!")
        returnCode = 401
        body = JSON.stringify({ "Error": "Item modification failed" });
    }
  } else {
    returnCode = 400
    body = JSON.stringify({
        "Error": "Invalid Request (missing or empty required field)",
        "item": JSON.stringify(cart_item) });
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