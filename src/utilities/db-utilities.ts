import { MongoClient } from "mongodb";
import { ObjectNotFoundError } from "../errors";
import { Factory } from "../models/factory";
import { Identifiable } from "../models/identifiable";

require("dotenv").config();
// TODO: Db connection pooling.

export class DbUtilities {
    //public static CONNECTION_STRING = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}/?${process.env.MONGO_OPTS}`;
    public static CONNECTION_STRING = `mongodb://${process.env.MONGO_HOST}/`;

    static async Insert<T extends Identifiable>(o: T, factory: Factory<T>) {
        const dbClient = new MongoClient(DbUtilities.CONNECTION_STRING);
        try {
            await dbClient.connect();
            const database = dbClient.db(process.env.MONGO_DBNAME);
            const collection = database.collection(factory.collectionName);
            const result = await collection.insertOne(o);
            if (!result) {
                throw new Error("Error inserting.");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Get<T extends Identifiable>(
        id: string,
        factory: Factory<T>
    ): Promise<T> {
        const dbClient = new MongoClient(DbUtilities.CONNECTION_STRING);
        try {
            await dbClient.connect();
            const database = dbClient.db(process.env.MONGO_DBNAME);
            const collection = database.collection(factory.collectionName);
            const data = await collection.findOne<T>({ id: id });
            if (!data) {
                throw new ObjectNotFoundError(
                    "Error getting object with id " + id + "."
                );
            }
            let o = factory.make(data);
            return o;
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
        //return {} as T;
    }

    static async Update<T extends Identifiable>(o: T, factory: Factory<T>) {
        const dbClient = new MongoClient(DbUtilities.CONNECTION_STRING);
        try {
            const query = { id: o.id };
            await dbClient.connect();
            const database = dbClient.db(process.env.MONGO_DBNAME);
            const collection = database.collection(factory.collectionName);
            const result = await collection.replaceOne(query, o);
            if (!result) {
                throw new Error("Error updating.");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Upsert<T extends Identifiable>(o: T, factory: Factory<T>) {
        const dbClient = new MongoClient(DbUtilities.CONNECTION_STRING);
        try {
            const query = { id: o.id };
            await dbClient.connect();
            const database = dbClient.db(process.env.MONGO_DBNAME);
            const collection = database.collection(factory.collectionName);
            const result = await collection.replaceOne(query, o, {
                upsert: true,
            });
            if (!result) {
                throw new Error("Error upserting.");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    // NOTE: We rarely need to hard-delete objects. You should probably consider soft-deleting.
    static async HardDelete<T extends Identifiable>(o: T, factory: Factory<T>) {
        console.warn(
            `HARD DELETE OF OBJECT ${o.id} FROM ${factory.collectionName}`
        );

        const dbClient = new MongoClient(DbUtilities.CONNECTION_STRING);
        try {
            await dbClient.connect();
            const database = dbClient.db(process.env.MONGO_DBNAME);
            const collection = database.collection(factory.collectionName);
            const query = { id: o.id };
            const data = await collection.deleteOne(query);
            if (!data) {
                throw new Error("Error deleting object with id " + o.id + ".");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Query<T>(
        query: any,
        factory: Factory<T>,
        projection?: any,
        sort?: any,
        limit?: number
    ): Promise<T[]> {
        const dbClient = new MongoClient(DbUtilities.CONNECTION_STRING);
        try {
            await dbClient.connect();
            const database = dbClient.db(process.env.MONGO_DBNAME);
            const collection = database.collection(factory.collectionName);
            const cursor = collection.find(query, { projection, sort, limit });
            const list: T[] = [];
            await cursor.forEach((doc) => {
                let o = factory.make(doc);
                list.push(o);
            });
            return list;
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }
}
