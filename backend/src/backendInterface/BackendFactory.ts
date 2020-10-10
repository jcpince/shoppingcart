import { AWSUserDBHelper } from '../awsBackend/UserDBHelper'
import { assert } from 'console';
import { IUserDBHelper } from './UserDBHelper';

export class BackendFactory {
    private userDBHelper : IUserDBHelper;

    constructor (
        private readonly name = process.env.BACKEND_NAME)
    {
        if (this.name == "AWS") {
            this.userDBHelper = new AWSUserDBHelper();
        } else {
            console.error("Backend " + name + " not supported yet!");
            assert(false);
        }
    }

    public getUserDBHelper() : IUserDBHelper
    {
        return this.userDBHelper;
    }
};

export const backendFactory: BackendFactory = new BackendFactory();