/* eslint-disable @typescript-eslint/no-explicit-any */
import mysql from 'mysql2/promise'

export async function makeDb(config: any): Promise<any> {
    const connection = await mysql.createConnection(config)

    connection.on('error', (err: any) => {
        console.error(`Connection error ${err?.code}`, err)
    })

    return {
        query(sql: string, args: any): Promise<any> {
            return connection.query(sql, args)
        },
        execute(sql: string, args: any): Promise<any> {
            return connection.execute(sql, args)
        },
        // beginTransaction(): Promise<any> {
        //     return connection.awaitBeginTransaction();
        // },
        // commit(): Promise<any> {
        //     return connection.awaitCommit();
        // },
        // rollback(): Promise<any> {
        //     return connection.awaitRollback();
        // },
        // close(): Promise<any> {
        //     return connection.awaitEnd();
        // }
    }
}

export async function withTransaction(db: any, callback: any): Promise<void> {
    try {
        await db.beginTransaction()
        await callback()
        await db.commit()
    } catch (err) {
        await db.rollback()
        throw err
    } finally {
        await db.close()
    }
}

export default { makeDb, withTransaction }
