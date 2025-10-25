import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

const openDb = async () => {
    return open({
        filename: DATABASE_URL,
        driver: sqlite3.Database
    })
};

const db = await openDb();

export default db;