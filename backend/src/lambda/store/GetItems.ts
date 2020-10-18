import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'
import { IItemEntry, IItemSearch } from '../../backendInterface/StoreDBHelper'

const storeDBHelper = backendFactory.getStoreDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const params = event.queryStringParameters
  const search : IItemSearch = {
    "owner": params.owner,
    "criteria": params.criteria,
    "by_category": params.by_category == "True",
    "with_public": params.with_public == "True"
  }
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Searching for product " + JSON.stringify(search))

  if ( search && search.owner && search.owner != "" &&
        search.criteria && search.criteria != "") {
    var products : IItemEntry[];
    if (search.by_category)
        products = await storeDBHelper.getItems(search.owner, search.criteria,
                search.with_public);
    else
        products = await storeDBHelper.getItemsByName(search.owner, search.criteria,
                search.with_public);

    if (search) {
        returnCode = 200;
        body = JSON.stringify({
            products
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