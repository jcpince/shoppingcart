export interface IItemEntry {
    name: string;
    identifier: string;
    category: string;
    description: string;
    is_public: boolean;
    owner: string;
    pic_link?: string;
}

export interface IStoreDBHelper {
    tableName: string;
    getItems(owner: string, category: string, withPublic: boolean) : Promise<IItemEntry[]>;
    getItemsByName(owner: string, name: string, withPublic: boolean) : Promise<IItemEntry[]>;
    createItem(item: IItemEntry) : Promise<boolean>;
    deleteItem(item: IItemEntry) : Promise<boolean>;
}