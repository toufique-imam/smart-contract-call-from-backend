import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const client = await clientPromise;
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const document = {}
            const transferFromCollection = db.collection(TransferCollection)
            const documents = await transferFromCollection.find(document, { session }).toArray()
            res.status(200).json({
                "result": documents,
            })
        })
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    } finally {
        session.endSession();
    }
}