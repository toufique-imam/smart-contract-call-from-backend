import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    //delete all the transactions
    const client = await clientPromise;
    const session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const document = {}
            const transferCollection = db.collection(TransferCollection)
            await transferCollection.deleteMany(document, { session })
            res.status(200).json({
                "result": "success",
            })
        })
    }
    catch (e) {
        console.error(e)
        res.status(503).json(e)
    }
    finally {
        session.endSession();
    }
}