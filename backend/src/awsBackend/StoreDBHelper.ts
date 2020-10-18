import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';

import { IStoreDBHelper, IItemEntry } from '../backendInterface/StoreDBHelper'
import { AWSHelper } from './AwsHelper'

export class AWSStoreDBHelper implements IStoreDBHelper {
    tableName : string;
    private picBucketName : string;
    private urlExpiration : number;
    private client : DocumentClient;
    private logger : Logger;
    private s3 : AWS.S3;

    constructor(
        awsHelper: AWSHelper
    ) {
        this.tableName = process.env.STORE_TABLE,
        this.picBucketName = process.env.PICTURES_BUCKET_NAME,
        this.urlExpiration = Number(process.env.URL_EXPIRATION),
        this.logger = awsHelper.getLogger();
        this.client = awsHelper.getDBClient();
        this.s3 = awsHelper.getS3();
    }

    async getItems(owner: string, category: string, withPublic: boolean)
                : Promise<IItemEntry[]> {
        this.logger.debug("AWSStoreDB.getItems(" + owner +
                ", " + category + ", " + withPublic +
                ") called from " + this.tableName + ".");

        var result, pubresult : any;
        var expression : string = "";
        var attributes : any;
        var attributenames : any = null;
        var indexName : string;
        if (!category) {
            expression = '#o = :o'
            attributes = { ':o' : owner }
            attributenames = { '#o' : 'owner' }
            indexName = "OwnerIndex"
        } else {
            expression = 'category = :c'
            attributes = { ':c' : category }
            attributenames = null
            indexName = "CategoryIndex"
        }
        this.logger.debug("GetItems key expression: " + expression)
        result = await this.client.query({
            TableName: this.tableName,
            IndexName: indexName,
            KeyConditionExpression: expression,
            ExpressionAttributeValues: attributes,
            ExpressionAttributeNames: attributenames,
            ScanIndexForward: false
        }).promise()

        if (withPublic) {
            this.logger.debug("GetItems public")
            pubresult = await this.client.query({
                TableName: this.tableName,
                IndexName: "OwnerIndex",
                KeyConditionExpression: '#o = :o',
                ExpressionAttributeValues: { ':o' : 'ALL' },
                ExpressionAttributeNames: { '#o' : 'owner' },
                ScanIndexForward: false
            }).promise()
        }

        var items : IItemEntry[] = [];
        if (category) {
            // Need to filter the owner
            result.Items.forEach( (item: IItemEntry) => {
                if (item.owner != 'ALL' && item.owner == owner)
                    items.push(item)
            })
        } else items = result.Items

        if (pubresult)
            pubresult.Items.forEach( (item: IItemEntry) => {
                if (!category || item.category == category)
                    items.push(item)
            })

        return items;
    }

    async getItemsByName(owner: string, name: string, withPublic: boolean)
                : Promise<IItemEntry[]> {
        this.logger.debug("AWSStoreDB.getItemsByName(" + owner +
                "," + name + ", " + withPublic +
                ") called from " + this.tableName + ".");

        var result, pubresult : any;
        var items : IItemEntry[] = []

        if (owner != 'ALL') {
            result = await this.client.query({
                TableName: this.tableName,
                IndexName: "NameIndex",
                KeyConditionExpression: '#nm = :n AND #o = :o',
                ExpressionAttributeValues: {
                    ':n' : name,
                    ':o' : owner
                },
                ExpressionAttributeNames: {
                    "#nm": "name",
                    "#o" : "owner"
                },
                ScanIndexForward: false
            }).promise()

            items = result.Items;
        }

        if (withPublic || owner == 'ALL') {
            this.logger.debug("GetItems public")
            pubresult = await this.client.query({
                TableName: this.tableName,
                IndexName: "NameIndex",
                KeyConditionExpression: '#nm = :n AND #o = :o',
                ExpressionAttributeValues: {
                    ':n' : name,
                    ':o' : 'ALL'
                },
                ExpressionAttributeNames: {
                    "#nm": "name",
                    "#o" : "owner"
                },
                ScanIndexForward: false
            }).promise()

            if (items.length != 0)
                pubresult.Items.forEach( (item: IItemEntry) => {
                    items.push(item)
                })
            else items = pubresult.Items
        }
        
        return items;
    }

    getS3Key(item: IItemEntry) : string {
        const pic_folder : string = item.is_public ? 'public' : item.owner;
        const buff = Buffer.from(pic_folder + '/' + item.identifier);
        const key64 = buff.toString('base64');
        return key64;
    }

    getUploadUrl(item: IItemEntry): string {

        const key64 = this.getS3Key(item);
        this.logger.info('Getting a storage URL: ' + key64 +
            ' valid for ' + this.urlExpiration)
    
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.picBucketName,
            Key: key64,
            Expires: this.urlExpiration,
          })
      }

    async createItem(item: IItemEntry) : Promise<string> {
        this.logger.debug("AWSStoreDB.createItem(" + JSON.stringify(item) +
            ") called from " + this.tableName + ".");

        const url = this.getUploadUrl(item)
        const pic_folder : string = item.is_public ? 'public' : item.owner;
        item.pic_link = `https://${this.picBucketName}.s3.amazonaws.com/${pic_folder}/${item.identifier}`
        await this.client.put({
            TableName: this.tableName,
            Item: item
        }).promise()
        return url
    }

    async _deleteItem(item: IItemEntry) : Promise<boolean> {
        this.logger.debug("AWSStoreDB._deleteItem(" + item.name + ", " +
            item.identifier + ") called from " + this.tableName + ".");

        await this.client.delete({
            TableName: this.tableName,
            Key: { "name": item.name, "identifier": item.identifier }
        }, function(err, data) {
            if (err) console.error("delete " + item.name + ", " + item.identifier + " failed with ", err);
            else console.log("delete " + item.name + ", " + item.identifier + " succeeded:", data);
        }).promise()

        console.log("Now, deleting the s3 object")
        const key64 = this.getS3Key(item);
        var params = {
            Bucket: this.picBucketName,
            Key: key64
        };
        this.s3.deleteObject(params, function (err, data) {
            if (err)
                console.log(err, err.stack); // an error occurred
            else
                console.log("Successfuly deleted picture attached " + data); // successful response
        });
        console.log("Item " + item.name + ", " + item.identifier + "removed from the store.")
        return true;
    }

    async deleteItem(item: IItemEntry) : Promise<boolean> {
        
        return await this._deleteItem(item);
    }

    async getAllItems() : Promise<IItemEntry[]> {

        const resp = await this.client.scan({ TableName: this.tableName }).promise()
        return resp.Items as IItemEntry[]
    }

    async clearStore() : Promise<boolean> {

        const items = await this.getAllItems()
        console.log("Clearing the " + items.length + " from the store.")
        items.forEach(async item => {
            if (await this._deleteItem(item)) {
                console.log("Removed " + item.name + ", " + item.identifier);
            }
        });
        console.log("Store cleared")
        return true
    }
};