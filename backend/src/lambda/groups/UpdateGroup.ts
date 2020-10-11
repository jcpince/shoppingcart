import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
import { backendFactory } from '../../backendInterface/BackendFactory'

const groupDBHelper = backendFactory.getGroupDBHelper();

export const handler: APIGatewayProxyHandler =
    async (event: APIGatewayProxyEvent):
        Promise<APIGatewayProxyResult> => {

    const group = JSON.parse(event.body)
    var returnCode = 500;
    var body = JSON.stringify({ "Error": "Server failure" });

    console.log("Updating a group called " + group.identifier)

    if ( group.identifier && group.identifier != "" &&
            group.userid && group.userid != "") {
        
        if (group.addUser) {
            if (await AddUser(group.identifier, group.userid)) {
                returnCode = 200;
                body = JSON.stringify({
                    "identifier": group.identifier })
            }
        } else {
            if (await RemoveUser(group.identifier, group.userid)) {
                returnCode = 200;
                body = JSON.stringify({
                    "identifier": group.identifier })
            }
        }
    } else {
        returnCode = 400
        body = JSON.stringify({ "Error": "Invalid Request (wrong ids)" });
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

async function AddUser(identifier: string, userid: string) : Promise<boolean> {
    return groupDBHelper.addUserToGroup(identifier, userid)
}

async function RemoveUser(identifier: string, userid: string) : Promise<boolean> {
    return groupDBHelper.removeUserFromGroup(identifier, userid)
}