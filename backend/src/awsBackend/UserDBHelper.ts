import * as uuid from 'uuid'

import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';

import { IUserDBHelper, IUserEntry } from '../backendInterface/UserDBHelper'
import { AWSHelper } from './AwsHelper'

export class AWSUserDBHelper implements IUserDBHelper {
    tableName : string;
    private client : DocumentClient;
    private logger : Logger;

    constructor(
        awsHelper: AWSHelper
    ) {
        this.tableName = process.env.USERS_TABLE,
        this.logger = awsHelper.getLogger();
        this.client = awsHelper.getDBClient();
    }

    async hasUser(username: string) : Promise<boolean> {
        this.logger.debug("AWSUserDB.hasUser(" + username + ") called from " +
            this.tableName + ".");

        const result = await this.client.query({
            TableName: this.tableName,
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
        this.logger.debug("AWSUserDB.getUser(" + username + ") called from " +
        this.tableName + ".");
    
        const result = await this.client.query({
            TableName: this.tableName,
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
        this.logger.debug("AWSUserDB.addUser(" + username + ") called from " +
        this.tableName + ".");

        var userEntry : IUserEntry = {
            name: username,
            uuid: uuid.v4()
        };
        
        await this.client.put({
            TableName: this.tableName,
            Item: userEntry
          }).promise()
        
        return userEntry;
    }
    
    async deleteUser(username: string) : Promise<boolean> {
        this.logger.debug("AWSUserDB.deleteUser(" + username + ") called from " +
        this.tableName + ".");
        await this.client.delete({
            TableName: this.tableName,
            Key: {
                "name": username
            }
          }).promise()

        return true;
    }
};