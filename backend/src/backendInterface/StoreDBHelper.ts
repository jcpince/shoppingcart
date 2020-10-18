export interface IItemEntry {
    name: string;
    identifier?: string;
    category: string;
    description: string;
    is_public: boolean;
    owner: string;
    pic_link?: string;
}

export interface IItemSearch {
    owner: string;
    criteria: string;
    by_category: boolean;
    with_public: boolean;
}


export interface IStoreDBHelper {
    tableName: string;
    getItems(owner: string, category: string, withPublic: boolean) : Promise<IItemEntry[]>;
    getItemsByName(owner: string, name: string, withPublic: boolean) : Promise<IItemEntry[]>;
    createItem(item: IItemEntry) : Promise<string>;
    deleteItem(item: IItemEntry) : Promise<boolean>;
    clearStore() : Promise<boolean>;
}