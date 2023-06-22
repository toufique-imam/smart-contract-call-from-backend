import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next';
import { make_transaction, addTransaction } from "../../utils/ApiUtils";
import { DBName, TransferFromCollection, master } from "../../lib/constants";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { n } = req.body
    const to = master.pub_address
    if (!n) {
        res.status(405).json("request format error")
        return
    }

    var successfull = 0
    const client = await clientPromise;
    try {
        const db = client.db(DBName)
        const query = {}
        const transferFromCollection = db.collection(TransferFromCollection)
        const documents = await transferFromCollection.find(query).toArray()
        if (!documents) {
            res.status(503).json({
                "error": "no user found"
            })
            return;
        }
        var successfull = 0
        for (let i = 0; i < n; i++) {
            //randomly select a user
            const index = Math.floor(Math.random() * documents.length)
            console.log("index", index)
            const document = documents[index]
            console.log("document", document)
            const id = document.pub_address
            const private_key = document.private_key
            //randomly select an amount
            const amount = (Math.random() * (0.001 - 0.0001) + 0.0001).toPrecision(3).toString()
            const transactionHash = await make_transaction(id, to, private_key, amount)
            const _res = await addTransaction(id, to, amount, transactionHash)
            if (_res) {
                successfull += 1
            }
        }
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
        return;
    } finally {
        res.status(200).json({
            "result": "successfull: " + successfull + " out of " + n + " transactions"
        })
    }
}