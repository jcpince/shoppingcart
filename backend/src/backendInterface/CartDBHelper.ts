export interface ICartEntry {
    name: string;
    identifier: string;
    owner: string;
    group: string;
    cart_tablename: string;
}

export interface ICartItem {
    itemid: string;
    quantity: number;
    unit: string;
}


export interface ICartDBHelper {
    tableName: string;
    createCart(cart: ICartEntry) : Promise<boolean>;
    deleteCart(cart: ICartEntry) : Promise<boolean>;
    getCart(name: string, owner: string) : Promise<ICartEntry>;
    getOwnerCarts(group: string) : Promise<ICartEntry[]>;
    getGroupCarts(group: string) : Promise<ICartEntry[]>;
    pushItem(cartid:string, item: ICartItem) : Promise<boolean>;
    removeItem(cartid:string, item: ICartItem) : Promise<boolean>;
}