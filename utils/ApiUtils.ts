import clientPromise from "../lib/mongodb";
import { ethers } from "ethers";
import { DBName, TransferCollection } from "../lib/constants";
import { Network, Alchemy } from "alchemy-sdk";

export async function make_transaction(from: string, to: string, private_key: string, amount: string) {
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
export async function addTransaction(from: String, to: String, value: String, transactionHash: String) {
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

export async function getTotalGivenAmount(address: String) {
    const client = await clientPromise;
    const db = client.db(DBName)
    const query = [
        {
            $addFields: {
                amount: { $toDouble: "$value" }
            }
        },
        {
            '$match': {
                'from': address
            }
        },
        //sum the value
        {
            '$group': {
                '_id': '$from',
                'total': {
                    '$sum': '$amount'
                }
            }
        }
    ]
    const transfersCollection = db.collection(TransferCollection)
    const transfers = await transfersCollection.aggregate(query).toArray()
    console.log(transfers)
    if (!transfers || transfers.length == 0) {
        return 0
    }
    return transfers[0].total
}
export async function getTotalTakenAmount(address: String) {
    const client = await clientPromise;
    const db = client.db(DBName)
    const query = [
        {
            $addFields: {
                amount: { $toDouble: "$value" }
            }
        },
        {
            '$match': {
                'to': address
            }
        },
        //sum the value
        {
            '$group': {
                '_id': '$to',
                'total': {
                    '$sum': '$amount'
                }
            }
        }
    ]
    const transfersCollection = db.collection(TransferCollection)
    const transfers = await transfersCollection.aggregate(query).toArray()
    if (!transfers || transfers.length == 0) {
        return 0
    }
    return transfers[0].total
}

export async function getBalance(id: string) {

    const settings = {
        apiKey: process.env.ALCHEMY_API_KEY,
        network: Network.MATIC_MUMBAI,
    };
    const alchemy = new Alchemy(settings);
    const response = await alchemy.core.getBalance(id);
    return response.toString();
}