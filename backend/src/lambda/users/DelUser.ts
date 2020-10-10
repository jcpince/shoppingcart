import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'

const userDBHelper = backendFactory.getUserDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const user = JSON.parse(event.body)
  var returnCode = 500;
  var body = JSON.stringify({ "Error": "Server failure" });

  console.log("Deleting a user " + user.name)

  if ( user.name && user.name != "" ) {
    if ( ! await userDBHelper.hasUser(user.name) ) {
        returnCode = 404
        body = JSON.stringify({ "Error": "User not found" });
    } else if (await userDBHelper.deleteUser(user.name)) {
        returnCode = 200;
        body = JSON.stringify({
            "name": user.name
        })
        }
    } else {
        returnCode = 400
        body = JSON.stringify({ "Error": "Invalid Request (no valid name)" });
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