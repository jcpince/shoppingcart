import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'
import { IUserEntry } from '../../backendInterface/UserDBHelper';

const userDBHelper = backendFactory.getUserDBHelper();

export const handler: APIGatewayProxyHandler =
  async (event: APIGatewayProxyEvent):
    Promise<APIGatewayProxyResult> => {

  const user = JSON.parse(event.body)
  var returnCode = 401;
  var body = JSON.stringify({ "Error": "Invalid Request" });

  if ( user.name && user.name != "" ) {
    console.log("Connecting a user called " + user.name)
    var entry : IUserEntry = await userDBHelper.getUser(user.name);
    if (! entry ) {
        returnCode = 404
        body = JSON.stringify({ "Error": "User not found" });
    } else {
        returnCode = 200;
        body = JSON.stringify({
            "name": entry.name,
            "uuid": entry.uuid,
        })
    }
  } else {
    console.error("Invalid Connecting request")
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