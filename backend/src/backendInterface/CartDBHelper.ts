export interface ICartEntry {
    name: string;
    identifier: string;
    description: string;
    ownerid: string;
    groupid: string;
    pic_link: string;
}

export interface ICartItem {
    identifier: string;
    userid: string;
    cartid: string;
    itemid: string;
    quantity: number;
    unit: string;
}

export interface ICartDBHelper {
    tableName: string;
    clearCarts() : Promise<boolean>;
    createCart(cart: ICartEntry) : Promise<boolean>;
    deleteCart(cartid: string) : Promise<boolean>;
    emptyCart(cartid: string) : Promise<boolean>;
    getCart(name: string, owner: string) : Promise<ICartEntry>;
    getCartItems(cartid: string) : Promise<ICartItem[]>;
    pushItem(item: ICartItem) : Promise<boolean>;
    removeItem(item: ICartItem) : Promise<boolean>;
    changeItemQuantity(item: ICartItem) : Promise<boolean>;
}
