import clientPromise from "../../lib/mongodb";
import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"
const TransferFromCollection = "transfer_from"
async function make_transaction(from: string, to: string, private_key: string, amount: string) {
    console.log("Sending transaction...");
    console.log("From: " + from);
    console.log("To: " + to);
    console.log("Amount: " + amount);
    const network = process.env.POLYGON_NETWORK;
    const network_explorer = process.env.POLYGON_MUMBAI_EXPLORER;
    const provider = new ethers.AlchemyProvider(
        network,
        process.env.ALCHEMY_API_KEY
    );
    const signer = new ethers.Wallet(private_key, provider);
    const tx = await signer.sendTransaction({
        to: to,
        value: ethers.parseUnits(amount, "ether"),
    });
    console.log("Mining transaction...");
    console.log(`https://${network_explorer}/tx/${tx.hash}`);
    // Waiting for the transaction to be mined
    return tx.hash;
    //besikhon dhore rakle 504 error dey
    const receipt = await tx.wait();
    // The transaction is now on chain!
    console.log(`Mined in block ${receipt?.blockNumber}`);

}
async function addTransaction(from: String, to: String, value: String, transactionHash: String) {
    const client = await clientPromise;
    const session = client.startSession();
    var res = false
    try {
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const document = {
                to: to,
                from: from,
                value: value,
                transactionHash: transactionHash,
                timeStamp: Date.now()
            }
            const transferCollection = db.collection(TransferCollection)
            const hasDocument = await transferCollection.findOne(document)
            if (!hasDocument) {
                await transferCollection.insertOne(document, { session })
            }
            res = true
        })
    } catch (e) {
        console.error("check", e);
    } finally {
        session.endSession();
        return res
    }
}
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { n } = req.body
    const to = "0x60B5Ad2f18BCbdBF87c4D79E0db423230B76FBa6"
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