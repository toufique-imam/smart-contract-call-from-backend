import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next';
import { Network, Alchemy } from "alchemy-sdk";

const DBName = "contract_transfer"
const TransferFromCollection = "transfer_from"
async function getBalance(id: string) {

    const settings = {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: Network.MATIC_MUMBAI,
    };
    const alchemy = new Alchemy(settings);
    const response = await alchemy.core.getBalance(id);
    return response.toString();
}
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