import * as AWS  from 'aws-sdk'

import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Logger } from 'winston';

import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)

export class AWSHelper {
    static logger = createLogger('AWS')
    constructor(
        private readonly dynamodb: AWS.DynamoDB = new XAWS.DynamoDB(),
        private readonly dbclient: DocumentClient = AWSHelper.connectDBClient()
    )
    {
        this.applyWAs()
    }

    public getDBClient() : DocumentClient {
        return this.dbclient;
    }

    public getDynamoDB() : AWS.DynamoDB {
        return this.dynamodb;
    }

    public getLogger() : Logger {
        return AWSHelper.logger;
    }

    private applyWAs() {
        if (process.env.IS_OFFLINE) {
            /* Workaround for offline testing */
            process.env._X_AMZN_TRACE_ID = "0"
        }
    }

    private static connectDBClient() : DocumentClient {
        AWSHelper.logger.debug("connectDBClient() called.");
        if (process.env.IS_OFFLINE) {
            AWSHelper.logger.info('Creating a local DynamoDB instance')
            return new XAWS.DynamoDB.DocumentClient({
              region: 'localhost',
              endpoint: 'http://localhost:8000'
            })
          }
          AWSHelper.logger.info('Creating a remote DynamoDB instance')
          return new XAWS.DynamoDB.DocumentClient()
    }
};