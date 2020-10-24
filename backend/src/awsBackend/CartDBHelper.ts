import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';
import * as uuid from 'uuid'

import { ICartDBHelper, ICartEntry, ICartItem } from '../backendInterface/CartDBHelper'
import { AWSHelper } from './AwsHelper'

export class AWSCartDBHelper implements ICartDBHelper {
    tableName : string;
    private client : DocumentClient;
    private logger : Logger;
    private cartsTableName : string;

    constructor(
        awsHelper: AWSHelper
    ) {
        this.tableName = process.env.CARTS_TABLE,
        this.cartsTableName = process.env.CARTS_CONTENTS_TABLE,
        this.logger = awsHelper.getLogger();
        this.client = awsHelper.getDBClient();
    }

    async getAllCarts() : Promise<ICartEntry[]> {

        const resp = await this.client.scan({ TableName: this.tableName }).promise()
        return resp.Items as ICartEntry[]
    }

    async getAllCartsItems() : Promise<ICartItem[]> {

        const resp = await this.client.scan({ TableName: this.cartsTableName }).promise()
        return resp.Items as ICartItem[]
    }

    async clearCarts() : Promise<boolean> {

        const carts = await this.getAllCarts()
        console.log("Clearing the " + carts.length + " carts.")
        carts.forEach(async cart => {
            await this.client.delete({
                TableName: this.tableName,
                Key: { "identifier": cart.identifier }
            }, function(err, data) {
                if (err) console.error("delete " + cart.name + ", " + cart.identifier + " failed with ", err);
                else console.log("delete " + cart.name + ", " + cart.identifier + " succeeded:", data);
            }).promise()
        });

        // Now, clear the contents
        const items = await this.getAllCartsItems()
        console.log("Clearing the " + items.length + " carts items.")
        items.forEach(async item => {
            await this.client.delete({
                TableName: this.cartsTableName,
                Key: {
                    "identifier": item.identifier,
                }
            }).promise()
        });
        console.log("Carts cleared")
        return true
    }

    async getCart(name: string, owner: string) : Promise<ICartEntry> {
        this.logger.debug("AWSCartDB.getCart(" + name + ", " +
            owner + ") called from " + this.tableName + ".");

        const result = await this.client.query({
            TableName: this.tableName,
            IndexName: "NameIndex",
            KeyConditionExpression: '#nm = :n AND ownerid = :o',
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

    async createCart(cart: ICartEntry) : Promise<boolean> {
        this.logger.debug("AWSCartDB.createCart(" + JSON.stringify(cart) +
            ") called from " + this.tableName + ".");

        cart.identifier = uuid.v4()
        await this.client.put({
            TableName: this.tableName,
            Item: cart
          }).promise()
        return true;
    }

    async deleteCart(cartid: string) : Promise<boolean> {
        this.logger.debug("AWSCartDB.deleteCart(" + cartid +
            ") called from " + this.tableName + ".");

        await this.client.delete({
            TableName: this.tableName,
            Key: {
                "identifier": cartid
            }
          }).promise()

        return true;
    }

    async emptyCart(cartid: string) : Promise<boolean> {
        this.logger.debug("AWSCartDB.emptyCart(" + cartid +
            ") called from " + this.cartsTableName + ".");

        const items = await this._getCartItems(cartid);
        items.forEach(async item => {
            console.log("Removing item " + item.identifier +
                " from the cart " + cartid)
            await this.client.delete({
                TableName: this.cartsTableName,
                Key: {
                    "identifier": item.identifier,
                }
            }).promise()
        });

        return true;
    }

    async pushItem(item: ICartItem) : Promise<boolean> {
        this.logger.debug("AWSCartDB.pushItem(" + JSON.stringify(item) +
                ") into " + this.cartsTableName + ".");
        item.identifier = uuid.v4()
        await this.client.put({
            TableName: this.cartsTableName,
            Item: item
          }).promise()

        return true;
    }

    async _getCartItems(cartid:string) : Promise<ICartItem[]> {
        this.logger.debug("AWSCartDB.geCartItems(" + cartid + ") from " +
                this.cartsTableName + ".");
        const result = await this.client.query({
            TableName: this.cartsTableName,
            IndexName: "CartIndex",
            KeyConditionExpression: 'cartid = :c',
            ExpressionAttributeValues: {
                ':c' : cartid
            },
            ScanIndexForward: false
        }).promise()

        return result.Items as ICartItem[];
    }

    async getCartItems(cartid: string) : Promise<ICartItem[]> {
        return this._getCartItems(cartid);
    }

    async getItem(cartid:string, itemid:string) : Promise<ICartEntry> {
        this.logger.debug("AWSCartDB.getItem(" + cartid + ", " +
            itemid + ") from " + this.cartsTableName + ".");
        const result = await this.client.query({
            TableName: this.cartsTableName,
            KeyConditionExpression: 'cartid = :c AND itemid = :i',
            ExpressionAttributeValues: {
                ':c' : cartid,
                ':i' : itemid
            },
            ScanIndexForward: false
        }).promise()

        return result.Items[0] as ICartEntry;
    }

    async removeItem(item: ICartItem) : Promise<boolean> {
        this.logger.debug("AWSCartDB.removeItem(" + JSON.stringify(item) +
                ") from " + this.cartsTableName + ".");
        await this.client.delete({
            TableName: this.cartsTableName,
            Key: {
                'identifier': item.identifier
            }
          }).promise()

        return true;
    }

    async changeItemQuantity(item: ICartItem) : Promise<boolean> {
        this.logger.debug("TODO: AWSCartDB.changeItemQuantity(" + JSON.stringify(item) +
                ") from " + this.cartsTableName + ".");

        await this.client.update({
          TableName: this.cartsTableName,
          Key: {
              'identifier': item.identifier
          },
          UpdateExpression: "set quantity = :q, #u = :u",
          ExpressionAttributeValues: {
              ":q": item.quantity,
              ":u": item.unit
          },
          ExpressionAttributeNames: {
            "#u": "unit"
          }
        }).promise()

        return true;
    }
};
