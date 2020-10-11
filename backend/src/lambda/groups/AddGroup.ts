import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'

const groupDBHelper = backendFactory.getGroupDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const group = JSON.parse(event.body)
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Adding a group called " + group.identifier)

  if ( group.identifier && group.identifier != "" ) {
    const item = await groupDBHelper.getGroup(group.identifier)
    if (! item) {
        if (await groupDBHelper.addGroup(group.identifier)) {
            returnCode = 201;
            body = JSON.stringify({
                "identifier": group.identifier
            })
        }
    }
    else {
        console.error("Group already there: " + JSON.stringify(item))
        returnCode = 401
        body = JSON.stringify({ "Error": "Group already exists" });
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