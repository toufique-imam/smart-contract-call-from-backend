import type { NextApiRequest, NextApiResponse } from 'next';
import { master } from "../../lib/constants";
import { make_transaction, addTransaction, getTotalGivenAmount } from "../../utils/ApiUtils";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { to } = req.body
    if (!to) {
        res.status(405).json("request format error")
        return
    }
    const from = master.pub_address

    try {
        const amount = await getTotalGivenAmount(to)

        if (!amount) {
            res.status(503).json({
                "error": "no user found"
            })
            return;
        }
        //random(0.97*amount, 1.02*amount)
        const transferAmount = (Math.random() * (1.02 * amount - 0.97 * amount) + 0.97 * amount).toPrecision(3);
        console.log(transferAmount)
        const tx = await make_transaction(from, to, master.private_key, transferAmount)
        const successfull = await addTransaction(from, to, transferAmount, tx)
        if (!successfull) {
            res.status(503).json({
                "error": "transaction failed"
            })
            return;
        }
    } catch (e) {
        console.error(e)
        res.status(503).json(e)
        return;
    } finally {
        res.status(200).json({
            "result": "payment successfull"
        })
    }
}