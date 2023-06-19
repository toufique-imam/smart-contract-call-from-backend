import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"
// const RanklistCollection = "reward_ranklist"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { from, value, transactionHash } = req.body
    const to = "0x7F568433F1BD0865Cb8B14314F6f7C278660De5d"
    if (!from || !to || !value) {
        res.status(405).json("request format error")
        return
    }
    console.log("from: ", from, " to: ", to, " value: ", value, " transactionHash: ", transactionHash)

    const client = await clientPromise;
    const session = client.startSession();
    try {
        let reward = Number(value) //wei to gwei
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const document = {
                to: to,
                from: from,
                value: reward,
                transactionHash: transactionHash
            }
            const transferCollection = db.collection(TransferCollection)
            const hasDocument = await transferCollection.findOne(document)
            if (!hasDocument) {
                await transferCollection.insertOne(document, { session })
            }
        })
        res.status(200).json({
            "success": true
        })
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    } finally {
        session.endSession();
    }
}