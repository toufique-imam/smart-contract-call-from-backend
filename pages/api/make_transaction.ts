import clientPromise from "../../lib/mongodb";
import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from 'next';

const DBName = "contract_transfer"
const TransferCollection = "transfers"
const TransferFromCollection = "transfer_from"
async function make_transaction(from: string, to: string, private_key: string, amount: string) {
    const network = process.env.POLYGON_NETWORK;
    const network_explorer = process.env.POLYGON_MUMBAI_EXPLORER;
    const provider = new ethers.AlchemyProvider(
        network,
        process.env.ALCHEMY_API_KEY
    );
    const signer = new ethers.Wallet(private_key, provider);
    const tx = await signer.sendTransaction({
        to: to,
        value: ethers.parseUnits("0.001", "ether"),
    });
    
    console.log("Mining transaction...");
    console.log(`https://${network_explorer}/tx/${tx.hash}`);
    // Waiting for the transaction to be mined
    const receipt = await tx.wait();
    // The transaction is now on chain!
    console.log(`Mined in block ${receipt?.blockNumber}`);
    return tx.hash;
}
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { id, amount } = req.body
    const to = "0x60B5Ad2f18BCbdBF87c4D79E0db423230B76FBa6"
    if (!id || !to || !amount) {
        res.status(405).json("request format error")
        return
    }
    var transactionHash = ""

    const client = await clientPromise;
    var session = client.startSession();
    try {
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const query = {
                "pub_address": id
            }
            const transferFromCollection = db.collection(TransferFromCollection)
            const document = await transferFromCollection.findOne(query, { session })
            if(!document){
                session.endSession()
                res.status(503).json({
                    "error": "sender private key not found"
                })
                return;
            }
            console.log("priv", document)
            const private_key = document.private_key
            transactionHash = await make_transaction(id, to, private_key, amount)
        })
    } catch (e) {
        res.status(503).json(e)
        return;
    }finally {
        session.endSession()
        if(!transactionHash){
            res.status(503).json({
                "error": "transaction hash null"
            })
            return;
        }
    }
    console.log("from: ", id, " to: ", to, " value: ", amount, " transactionHash: ", transactionHash)   
    session = client.startSession()
    try {
        let reward = Number(amount) //wei to gwei
        await session.withTransaction(async () => {
            const db = client.db(DBName)
            const document = {
                to: to,
                from: id,
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