export interface IUserEntry {
    name: string;
    uuid: string;
}

export interface IUserDBHelper {
    tableName: string;
    hasUser(username: string) : Promise<boolean>;
    getUser(username: string) : Promise<IUserEntry>;
    addUser(username: string) : Promise<IUserEntry>;
    deleteUser(username: string) : Promise<boolean>;
}