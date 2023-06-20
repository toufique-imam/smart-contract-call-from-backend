import Head from 'next/head'
import clientPromise from '../lib/mongodb'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import { makeGetRequest, makePostRequest, parseServerResponse } from '../utils/MongodbUtils'
import 'bootstrap/dist/css/bootstrap.css'
type ConnectionStatus = {
  isConnected: boolean
}

export const getServerSideProps: GetServerSideProps<
  ConnectionStatus
> = async () => {
  try {
    await clientPromise
    return {
      props: { isConnected: true },
    }
  } catch (e) {
    console.error(e)
    return {
      props: { isConnected: false },
    }
  }
}

export default function Home({
  isConnected,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [addresses, setAddresses] = useState<any>([])
  const [transactions, setTransactions] = useState<any>([])
  async function getAddresses() {
    const response = await makeGetRequest('/api/get_ids')
    try {
      const responseData: Array<any> = await parseServerResponse(response)
      setAddresses(responseData)
    } catch (e) {
      console.error(e)
    }
  }
  async function getTransaction() {
    const response = await makeGetRequest('/api/get_transaction')
    try {
      const responseData: Array<any> = await parseServerResponse(response)
      setTransactions(responseData)
    } catch (e) {
      console.error(e)
    }
  }
  async function makeTransaction(id: String, amount: number) {
    const body = {
      id: id,
      amount: amount,
    }
    try {
      const response = await makePostRequest('/api/make_transaction', JSON.stringify(body))
      await parseServerResponse(response)
      alert("Transaction made")
      getAddresses()
      getTransaction()
    } catch (e) {
      console.error(e)
      alert("Error making transaction")
    }
  }
  useEffect(() => {
    getAddresses()
    getTransaction()
  }, [])
  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>

        {isConnected ? (
          <h2 className="subtitle">You are connected to MongoDB</h2>
        ) : (
          <h2 className="subtitle">
            You are NOT connected to MongoDB. Check the <code>README.md</code>{' '}
            for instructions.
          </h2>
        )}
        <h1 className='title'> Make Transaction </h1>
        <table className='table  m-2 p-2'>
          <thead>
            <tr>
              <td scope='col'> Address </td>
              <td scope='col'> P.Address </td>
              <td scope='col'> Balance </td>
              <td scope='col'> Send </td>
            </tr>
          </thead>
          <tbody>
            {addresses.map((e: any) => (
              <tr key={e._id}>
                <td>{e.pub_address}</td>
                <td>{e.private_key.slice(0,4)+"..."+e.private_key.slice(-4)}</td>
                <td>{e.balance}</td>
                <td>
                    <button className='btn btn-primary' onClick={() => makeTransaction(e.pub_address, 0.001)}>Send</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h1 className='title'> Past Transactions </h1>
        <table className='table  m-2 p-2'>
          <thead>
            <tr>
              <td scope='col'> FROM </td>
              <td scope='col'> TO </td>
              <td scope='col'> amount </td>
              <td scope='col'> txHash </td>
            </tr>
          </thead>
          <tbody>
            {transactions.map((e: any) => (
              <tr key={e._id}>
                <td>{e.from.slice(0,4)+'...'+e.from.slice(-4)}</td>
                <td>{e.to.slice(0, 4) + '...' +e.to.slice(-4)}</td>
                <td>{e.value}</td>
                <td>{e.transactionHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}
