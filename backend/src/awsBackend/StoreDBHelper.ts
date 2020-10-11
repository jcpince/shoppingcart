import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';

import { IStoreDBHelper, IItemEntry } from '../backendInterface/StoreDBHelper'
import { AWSHelper } from './AwsHelper'

export class AWSStoreDBHelper implements IStoreDBHelper {
    tableName : string;
    private client : DocumentClient;
    private logger : Logger;

    constructor(
        awsHelper: AWSHelper
    ) {
        this.tableName = process.env.STORE_TABLE,
        this.logger = awsHelper.getLogger();
        this.client = awsHelper.getDBClient();
    }

    async getItems(owner: string, category: string, withPublic: boolean)
                : Promise<IItemEntry[]> {
        this.logger.debug("AWSStoreDB.getItems(" + owner +
                "," + category + ", " + withPublic +
                ") called from " + this.tableName + ".");

        var result;
        var base_expression : string = "";
        if ( withPublic != null)
            base_expression = 'is_public = ' +
                        withPublic ? "true, " : "false, ";
        if (!category) {
            result = await this.client.query({
                TableName: this.tableName,
                KeyConditionExpression: base_expression + 'owner = :o',
                ExpressionAttributeValues: {
                ':o' : owner,
                },
                ScanIndexForward: false
            }).promise()
        } else {
            result = await this.client.query({
                TableName: this.tableName,
                KeyConditionExpression: base_expression + 'owner = :o, category = :c',
                ExpressionAttributeValues: {
                ':o' : owner,
                ':c' : category
                },
                ScanIndexForward: false
            }).promise()
        }
        if (result.Count == 0) return null;
        return result.Items as IItemEntry[];
    }

    async getItemsByName(owner: string, name: string, withPublic: boolean)
                : Promise<IItemEntry[]> {
        this.logger.debug("AWSStoreDB.getItemsByName(" + owner +
                "," + name + ", " + withPublic +
                ") called from " + this.tableName + ".");

        var result;
        var base_expression : string = "";
        if ( withPublic != null)
            base_expression = 'is_public = ' +
                        withPublic ? "true, " : "false, ";
        result = await this.client.query({
            TableName: this.tableName,
            KeyConditionExpression: base_expression + 'owner = :o, #nm = :n',
            ExpressionAttributeValues: {
            ':o' : owner,
            ':n' : name
            },
            ExpressionAttributeNames: {
              "#nm": "name"
            },
            ScanIndexForward: false
        }).promise()
        if (result.Count == 0) return null;
        return result.Items as IItemEntry[];
    }

    async createItem(item: IItemEntry) : Promise<boolean> {
        this.logger.debug("AWSStoreDB.createItem(" + item.name +
            ") called from " + this.tableName + ".");

        await this.client.put({
            TableName: this.tableName,
            Item: item
        }).promise()
        return true;
    }

    async deleteItem(item: IItemEntry) : Promise<boolean> {
        this.logger.debug("AWSStoreDB.deleteItem(" + item.name +
            ") called from " + this.tableName + ".");

        await this.client.delete({
            TableName: this.tableName,
            Key: { "identifier": item.identifier }
        }, function(err, data) {
            if (err) console.error("delete failed with ", err);
            else console.log("delete succeeded: ", data);
        }).promise()
        return true;
    }
};