// noinspection SpellCheckingInspection

import { createPool, PoolConnection } from 'mysql2/promise';
import { Pool } from 'mysql2/promise';
// import console from "@/services/console.s";
import fs from "node:fs";
import dns from 'dns';
interface DatabaseConnection {
    timestamp: number;
    connection: PoolConnection;
}

class db {
    public static pool: Pool;
    public static simpleQuery: PoolConnection;
    public static recycleAfter = 1000 * 20; // 20 seconds 
    constructor() {
        (async () => {
            console.info('Database class initialized');
            if (!process.env.DB_PASSWORD) {
                const pswdFile = process.env.DB_PASSWORD_FILE || '/run/secrets/db_password';
                if (!fs.existsSync(pswdFile)) return console.error('DB_PASSWORD not set and no password file found');
                process.env.DB_PASSWORD = fs.readFileSync(pswdFile).toString();
            }
            console.debug('Checking DB_HOST');
            const host = process.env.DB_HOST;
            if (!host) {
                console.error('DB_HOST not set');
                process.exit(1);
            }
            console.debug('Resolving ' + host);
            let ip: any = { address: host }
            if (process.env.DB_RESOLVE == "true") ip = await dns.promises.lookup(host).catch(err => {
                console.error('Error looking up ' + host + ': ' + err);
                process.exit(1);
            });
            console.debug('Creating pool');
            db.pool = createPool({
                host: ip.address,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_DB,
                port: parseInt(process.env.DB_PORT || '3306'),
                ssl: {
                    rejectUnauthorized: false
                },
                waitForConnections: true,
                connectionLimit: 100,
                queueLimit: 0
            });
            console.debug('Creating simple query connection');
            try {
                db.simpleQuery = await db.pool.getConnection();
                db.rebuild();
            } catch (err) {
                console.debug('Connection to ' + process.env.DB_HOST + ' (' + ip.address + ':' + process.env.DB_PORT + ') failed');
                console.error('Error creating simple query connection: ' + err);
                process.exit(1);
            }
        })();
    }
    public static async rebuild() {
        db.simpleQuery.on('error', async (err) => {
            console.error('Error in simple query connection: ' + err);
            db.simpleQuery.release();
            console.debug('Simple query connection released');
            try {
                db.simpleQuery = await db.pool.getConnection();
                console.debug('Simple query connection recreated');
            } catch (err) {
                console.error('Error recreating simple query connection: ' + err);
                process.exit(1);
            }
        });
        db.simpleQuery.on('end', async () => {
            console.debug('Simple query connection ended');
            try {
                db.simpleQuery = await db.pool.getConnection();
                console.debug('Simple query connection recreated');
            } catch (err) {
                console.error('Error recreating simple query connection: ' + err);
                process.exit(1);
            }
        });
    }
    public static async getConnection() {
        console.debug('Getting connection');
        let connection: PoolConnection = await db.pool.getConnection();
        let timestamp = Date.now();
        setTimeout(() => {
            connection.release();
            console.debug('Connection released');
        }, this.recycleAfter);
        return connection;
    }
    public static async query(query: string, values?: any) {
        const [rows] = await db.simpleQuery.query(query, values);
        return rows;
    }
}
export default db;