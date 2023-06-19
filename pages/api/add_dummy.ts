import clientPromise from "../../lib/mongodb";

import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferFromCollection = "transfer_from"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const client = await clientPromise;
    const session = client.startSession();
    //add dummy data
    const dummyData = [
        {
            "pub_address": "0x1F568433F1BD0865Cb8B14314F6f7C278660De5d",
            "amount": Math.random() * 1000,
        },
        {
            "amount": Math.random() * 1000,
            "pub_address": "0x2F568433F1BD0865Cb8B14314F6f7C278660De5d",
        },
        {
            "amount": Math.random() * 1000,
            "pub_address": "0x3F568433F1BD0865Cb8B14314F6f7C278660De5d",
        },
        {
            "amount": Math.random() * 1000,
            "pub_address": "0x4F568433F1BD0865Cb8B14314F6f7C278660De5d",
        },
        {
            "amount": Math.random() * 1000,
            "pub_address": "0x5F568433F1BD0865Cb8B14314F6f7C278660De5d",
        },
        {
            "amount": Math.random() * 1000,
            "pub_address": "0x6F568433F1BD0865Cb8B14314F6f7C278660De5d",
        }
    ]
    try {
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const transferFromCollection = db.collection(TransferFromCollection)
            await transferFromCollection.insertMany(dummyData, { session })
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