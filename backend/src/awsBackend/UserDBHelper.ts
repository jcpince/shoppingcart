import * as AWS  from 'aws-sdk'
import * as uuid from 'uuid'

import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { IUserDBHelper, IUserEntry } from '../backendInterface/UserDBHelper'
import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('AWSUserDB')

export class AWSUserDBHelper implements IUserDBHelper {
    tableName: string;

    constructor(
        private readonly table = process.env.USERS_TABLE,
        private readonly client: DocumentClient = connectDB(),
    ) {}

    async hasUser(username: string) : Promise<boolean> {
        logger.debug("AWSUserDB.hasUser(" + username + ") called from " +
            this.table + ".");

        const result = await this.client.query({
            TableName: this.table,
            KeyConditionExpression: '#nm = :n',
            ExpressionAttributeValues: {
            ':n': username
            },
            ExpressionAttributeNames: {
              "#nm": "name"
            },
            ScanIndexForward: false
        }).promise()
        return result.Count != 0
    }

    async getUser(username: string) : Promise<IUserEntry> {
        logger.debug("AWSUserDB.getUser(" + username + ") called from " +
        this.table + ".");
    
        const result = await this.client.query({
            TableName: this.table,
            KeyConditionExpression: '#nm = :n',
            ExpressionAttributeValues: {
            ':n': username
            },
            ExpressionAttributeNames: {
              "#nm": "name"
            },
            ScanIndexForward: false
        }).promise()
        console.log("Retrieved " + JSON.stringify(result))
        if (result.Count == 0) return null;
        return result.Items[0] as IUserEntry;
    }

    async addUser(username: string) : Promise<IUserEntry> {
        logger.debug("AWSUserDB.addUser(" + username + ") called from " +
        this.table + ".");

        var userEntry : IUserEntry = {
            name: username,
            uuid: uuid.v4()
        };
        
        await this.client.put({
            TableName: this.table,
            Item: userEntry
          }).promise()
        
        return userEntry;
    }
    
    async deleteUser(username: string) : Promise<boolean> {
        logger.debug("AWSUserDB.deleteUser(" + username + ") called from " +
        this.table + ".");
        await this.client.delete({
            TableName: this.table,
            Key: {
                "name": username
            }
          }).promise()

        return true;
    }
};

function connectDB() : DocumentClient {
    logger.debug("connectDB() called.");
    if (process.env.IS_OFFLINE) {
        /* Workaround for offline testing */
        process.env._X_AMZN_TRACE_ID = "0"
        logger.info('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
          region: 'localhost',
          endpoint: 'http://localhost:8000'
        })
      }
      logger.info('Creating a remote DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient()
}