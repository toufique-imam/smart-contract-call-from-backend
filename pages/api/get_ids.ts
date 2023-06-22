import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next';
import { DBName, TransferFromCollection } from "../../lib/constants";
import { getBalance, getTotalGivenAmount } from "../../utils/ApiUtils";

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
            const transferFromCollection = db.collection(TransferFromCollection)
            const documents = await transferFromCollection.find(document, { session }).toArray()
            //get the balance from the blockchain
            for (let i = 0; i < documents.length; i++) {
                const document = documents[i]
                const balance = await getBalance(document.pub_address)
                const usedBalance = await getTotalGivenAmount(document.pub_address)
                document.usedBalance = usedBalance
                document.balance = balance
            }
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