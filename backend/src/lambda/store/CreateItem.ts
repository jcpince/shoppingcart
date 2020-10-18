import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'
import { IItemEntry } from '../../backendInterface/StoreDBHelper'

import * as uuid from 'uuid'

const storeDBHelper = backendFactory.getStoreDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const product = JSON.parse(event.body) as IItemEntry
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Adding a new product " + product.identifier)

  if ( product.name && product.name != "" ) {
    product.identifier = uuid.v4()
    const url : string = await storeDBHelper.createItem(product);
    if (url) {
        returnCode = 201;
        body = JSON.stringify({
            'temporary-upload-url' : url,
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