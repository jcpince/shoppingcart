export interface IGroupEntry {
    identifier: string;
    users: string[];
}

export interface IGroupDBHelper {
    tableName: string;
    getGroup(group_id: string) : Promise<IGroupEntry>;
    addGroup(group_id: string) : Promise<IGroupEntry>;
    deleteGroup(group_id: string) : Promise<boolean>;
    addUserToGroup(group_id: string, user_id: string) : Promise<boolean>;
    removeUserFromGroup(group_id: string, user_id: string) : Promise<boolean>;
}