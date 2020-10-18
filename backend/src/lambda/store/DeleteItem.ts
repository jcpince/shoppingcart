import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'
import { IItemEntry } from '../../backendInterface/StoreDBHelper'

const storeDBHelper = backendFactory.getStoreDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const product = JSON.parse(event.body) as IItemEntry
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Removing a product " + product.identifier)

  if ( product.identifier && product.identifier != "" ) {
    if (await storeDBHelper.deleteItem(product)) {
        returnCode = 200;
        body = JSON.stringify({
            'item': product
        })
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