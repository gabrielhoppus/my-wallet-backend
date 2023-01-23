import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.DATABASE_URL);
let db;

try {
    await client.connect();
    db = client.db();
    console.log("Sucesso");
} catch {
    console.log(err);
}

export default db;