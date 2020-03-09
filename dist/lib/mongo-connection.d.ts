declare class MongoConnection {
    db: any;
    client: any;
    constructor();
    connect(url: string, dbName: string): Promise<unknown>;
}
declare const _default: MongoConnection;
export default _default;
