import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';

import { ICartDBHelper, ICartEntry, ICartItem } from '../backendInterface/CartDBHelper'
import { AWSHelper } from './AwsHelper'
import * as DynamoDB from 'aws-sdk/clients/dynamodb';

export class AWSCartDBHelper implements ICartDBHelper {
    tableName : string;
    private client : DocumentClient;
    private logger : Logger;
    private dynamodb : DynamoDB;

    constructor(
        awsHelper: AWSHelper
    ) {
        this.tableName = process.env.CARTS_TABLE,
        this.logger = awsHelper.getLogger();
        this.client = awsHelper.getDBClient();
        this.dynamodb = awsHelper.getDynamoDB();
    }

    async getCart(name: string, owner: string) : Promise<ICartEntry> {
        this.logger.debug("AWSCartDB.getCart(" + name + ", " +
            owner + ") called from " + this.tableName + ".");

        const result = await this.client.query({
            TableName: this.tableName,
            KeyConditionExpression: '#nm = :n, owner = :o',
            ExpressionAttributeValues: {
            ':n' : name,
            ':o' : owner,
            },
            ExpressionAttributeNames: {
              "#nm": "name"
            },
            ScanIndexForward: false
        }).promise()
        if (result.Count == 0) return null;
        return result.Items[0] as ICartEntry;
    }

    async getOwnerCarts(owner: string) : Promise<ICartEntry[]> {
        this.logger.debug("AWSCartDB.getOwnerCarts(" + owner +
            ") called from " + this.tableName + ".");

        const result = await this.client.query({
            TableName: this.tableName,
            KeyConditionExpression: 'owner = :o',
            ExpressionAttributeValues: {
                ':o' : owner,
            },
            ScanIndexForward: false
        }).promise()
        if (result.Count == 0) return null;
        return result.Items as ICartEntry[];
    }

    async getGroupCarts(group: string) : Promise<ICartEntry[]> {
        this.logger.debug("AWSCartDB.getGroupCarts(" + group +
            ") called from " + this.tableName + ".");

        const result = await this.client.query({
            TableName: this.tableName,
            KeyConditionExpression: 'group = :g',
            ExpressionAttributeValues: {
                ':g' : group,
            },
            ScanIndexForward: false
        }).promise()
        if (result.Count == 0) return null;
        return result.Items as ICartEntry[];
    }

    async createCart(cart: ICartEntry) : Promise<boolean> {
        this.logger.debug("AWSCartDB.createCart(" + cart.name +
            ") called from " + this.tableName + ".");

        await this.client.put({
            TableName: this.tableName,
            Item: cart
          }).promise()
        
        var params = {
            AttributeDefinitions: [
                {
                AttributeName: "itemid", 
                AttributeType: "S"
                }, 
                {
                AttributeName: "quantity", 
                AttributeType: "N"
                }, 
                {
                AttributeName: "unit", 
                AttributeType: "S"
                }
            ], 
            KeySchema: [
               {
              AttributeName: "itemid", 
              KeyType: "HASH"
             }
            ], 
            ProvisionedThroughput: {
             ReadCapacityUnits: 5, 
             WriteCapacityUnits: 5
            }, 
            TableName: "Cart-" + cart.identifier,
            BillingMode: "PAY_PER_REQUEST",
           };
        await this.dynamodb.createTable(params).promise();
        return true;
    }

    async deleteCart(cart: ICartEntry) : Promise<boolean> {
        this.logger.debug("AWSCartDB.deleteCart(" + cart.name +
            ") called from " + this.tableName + ".");

        await this.client.delete({
            TableName: this.tableName,
            Key: {
                "identifier": cart.identifier
            }
          }).promise()
        
        var params = {
            TableName: "Cart-" + cart.identifier
        };
        await this.dynamodb.deleteTable(params).promise();

        return true;
    }
    
    async pushItem(cartid:string, item: ICartItem) : Promise<boolean> {
        this.logger.debug("AWSCartDB.pushItem(" + cartid + ", " +
            item.itemid + ") into " + this.tableName + ".");
        await this.client.put({
            TableName: "Cart-" + cartid,
            Item: item
          }).promise()

        return true;
    }
    
    async removeItem(cartid:string, item: ICartItem) : Promise<boolean> {
        this.logger.debug("AWSCartDB.pushItem(" + cartid + ", " +
            item.itemid + ") into " + this.tableName + ".");
        await this.client.delete({
            TableName: "Cart-" + cartid,
            Key: { "itemid" : item.itemid }
          }).promise()

        return true;
    }
};