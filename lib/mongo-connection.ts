import { MongoClient } from 'mongodb';

class MongoConnection {

    db: any;
    client: any;

    constructor() { }

    async connect(url: string, dbName: string) {
        return await new Promise((resolve, reject) => {
            MongoClient.connect(url, { useNewUrlParser: true }, (errors: any, client: any) => {
                if (errors) {
                    console.log(errors);
                    reject(errors);
                }
                else {
                    this.client = client;
                    this.db = client.db(dbName);
                    resolve(this.db);
                }
            });
        });
    }
}

export default new MongoConnection();
