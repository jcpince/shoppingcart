import { AWSUserDBHelper } from '../awsBackend/UserDBHelper'
import { AWSHelper } from '../awsBackend/AwsHelper'
import { assert } from 'console';
import { IUserDBHelper } from './UserDBHelper';
import { IGroupDBHelper } from './GroupDBHelper';
import { AWSGroupDBHelper } from '../awsBackend/GroupDBHelper';

export class BackendFactory {
    private userDBHelper : IUserDBHelper;
    private groupDBHelper : IGroupDBHelper;
    private awsHelper : AWSHelper;

    constructor (
        private readonly name = process.env.BACKEND_NAME)
    {
        if (this.name == "AWS") {
            this.awsHelper = new AWSHelper();
            this.userDBHelper = new AWSUserDBHelper(this.awsHelper);
            this.groupDBHelper = new AWSGroupDBHelper(this.awsHelper);
        } else {
            console.error("Backend " + name + " not supported yet!");
            assert(false);
        }
    }

    public getUserDBHelper() : IUserDBHelper
    {
        return this.userDBHelper;
    }

    public getGroupDBHelper() : IGroupDBHelper
    {
        return this.groupDBHelper;
    }
};

export const backendFactory: BackendFactory = new BackendFactory();