import clientPromise from "../../lib/mongodb";
import type { NextApiRequest, NextApiResponse } from 'next';
import { master } from "../../lib/constants";
import { getBalance, getTotalTakenAmount } from "../../utils/ApiUtils";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const client = await clientPromise;
    const session = client.startSession();
    try {
        let gotbalance = await getTotalTakenAmount(master.pub_address)
        let balance = await getBalance(master.pub_address)
        res.status(200).json({
            "result": {
                "balance": balance,
                "gotbalance": gotbalance,
                "address": master.pub_address,
            }
        })
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
    } finally {
        session.endSession();
    }
}