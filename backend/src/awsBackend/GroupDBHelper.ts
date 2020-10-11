import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';

import { IGroupDBHelper, IGroupEntry } from '../backendInterface/GroupDBHelper'
import { AWSHelper } from './AwsHelper'

export class AWSGroupDBHelper implements IGroupDBHelper {
    tableName : string;
    private client : DocumentClient;
    private logger : Logger;

    constructor(
        awsHelper: AWSHelper
    ) {
        this.tableName = process.env.GROUPS_TABLE,
        this.logger = awsHelper.getLogger();
        this.client = awsHelper.getDBClient();
    }

    async getGroup(group_id: string) : Promise<IGroupEntry> {
        this.logger.debug("AWSGroupDB.getGroup(" + group_id + ") called from " +
            this.tableName + ".");
    
        const result = await this.client.query({
            TableName: this.tableName,
            KeyConditionExpression: 'identifier = :id',
            ExpressionAttributeValues: {
            ':id': group_id
            },
            ScanIndexForward: false
        }).promise()
        if (result.Count == 0) return null;
        return result.Items[0] as IGroupEntry;
    }

    async addGroup(group_id: string) : Promise<IGroupEntry> {
        this.logger.debug("AWSGroupDB.addGroup(" + group_id + ") called from " +
            this.tableName + ".");
        
        var item = { "identifier": group_id };
        
        await this.client.put({
            TableName: this.tableName,
            Item: item
          }).promise()
        
        return item as IGroupEntry
    }

    async deleteGroup(group_id: string) : Promise<boolean> {
        this.logger.debug("AWSGroupDB.deleteGroup(" + group_id + ") called from " +
            this.tableName + ".");

        const result = await this.client.delete({
            TableName: this.tableName,
            Key: {
                "identifier": group_id
            }
          }).promise()
        console.log("delete group returned " + JSON.stringify(result));
        return true;
    }

    async addUserToGroup(group_id: string, user_id: string) : Promise<boolean> {
        this.logger.debug("AWSGroupDB.addUserToGroup(" + group_id + ", " +
            user_id + ") called from " + this.tableName + ".");

        var result = await this.client.update({
            TableName: this.tableName,
            Key: {
              "identifier": group_id
            },
            UpdateExpression: "add #us :u",
            ExpressionAttributeValues: {
                ":u": this.client.createSet([user_id]),
            },
            ExpressionAttributeNames: {
              "#us": "users"
            }
        }).promise()
        this.logger.debug("AWSGroupDB.addUserToGroup returned " + JSON.stringify(result));

        return true;
    }

    async removeUserFromGroup(group_id: string, user_id: string) : Promise<boolean> {
        this.logger.debug("AWSGroupDB.removeUserFromGroup(" + group_id + ", " +
            user_id + ") called from " + this.tableName + ".");

            var result = await this.client.update({
                TableName: this.tableName,
                Key: {
                  "identifier": group_id
                },
                UpdateExpression: "delete #us :u",
                ExpressionAttributeValues: {
                    ":u": this.client.createSet([user_id]),
                },
                ExpressionAttributeNames: {
                  "#us": "users"
                }
            }).promise()
            this.logger.debug("AWSGroupDB.removeUserFromGroup returned " + JSON.stringify(result));
    
            return true;
    }
};