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
            "pub_address": "0x08188D0D21fFa2A758Bc8F161e9781f932Af0dAb",
            "private_key": "3b7f2f5d8544268432152f336698c1852ac47a84e11f9354fd255d7b55b91923"
        },
        {
            "private_key": "081f7309d3573c83419571577e155ba5f6bf3f7a01c2f308e5886505c542c239",
            "pub_address": "0x11c082BE62016c19a532c207199C6E4a242B06D7",
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