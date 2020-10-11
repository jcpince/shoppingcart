import { AWSUserDBHelper } from '../awsBackend/UserDBHelper'
import { AWSHelper } from '../awsBackend/AwsHelper'
import { assert } from 'console';
import { IUserDBHelper } from './UserDBHelper';
import { IGroupDBHelper } from './GroupDBHelper';
import { ICartDBHelper } from './CartDBHelper';
import { IStoreDBHelper } from './StoreDBHelper';
import { AWSGroupDBHelper } from '../awsBackend/GroupDBHelper';
import { AWSCartDBHelper } from '../awsBackend/CartDBHelper';
import { AWSStoreDBHelper } from '../awsBackend/StoreDBHelper';

export class BackendFactory {
    private awsHelper : AWSHelper;
    private userDBHelper : IUserDBHelper;
    private groupDBHelper : IGroupDBHelper;
    private cartDBHelper : ICartDBHelper;
    private storeDBHelper : IStoreDBHelper;

    constructor (
        private readonly name = process.env.BACKEND_NAME)
    {
        if (this.name == "AWS") {
            this.awsHelper = new AWSHelper();
            this.userDBHelper = new AWSUserDBHelper(this.awsHelper);
            this.groupDBHelper = new AWSGroupDBHelper(this.awsHelper);
            this.cartDBHelper = new AWSCartDBHelper(this.awsHelper);
            this.storeDBHelper = new AWSStoreDBHelper(this.awsHelper);
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

    public getCartDBHelper() : ICartDBHelper
    {
        return this.cartDBHelper;
    }

    public getStoreDBHelper() : IStoreDBHelper
    {
        return this.storeDBHelper;
    }
};

export const backendFactory: BackendFactory = new BackendFactory();