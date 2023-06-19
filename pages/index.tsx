import Head from 'next/head'
import clientPromise from '../lib/mongodb'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import { makeGetRequest, makePostRequest, parseServerResponse } from '../utils/MongodbUtils'

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
  async function getAddresses() {
    const response = await makeGetRequest('/api/get_ids')
    if (!response.OK) {
      return;
    }
    console.log(response)
    try {
      const responseData: Array<any> = await parseServerResponse(response)
      console.log(responseData)
      setAddresses(responseData)
    } catch (e) {
      console.error(e)
    }

  }
  async function makeTransaction(id: String, amount: number) {
    const body = {
      id: id,
      amount: amount,
      transactionHash: "0x1234567890",
    }
    try {
      const response = await makePostRequest('/api/make_transaction', JSON.stringify(body))
      await parseServerResponse(response)
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => {
    getAddresses()
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
        {addresses.map((address: any) => {
          
            <div key={address._id}>
              <p>{address._id}</p>
              <p>{address.pub_address}</p>
              <button onClick={() => makeTransaction(address.pub_address, 100)}>Send 100</button>
            </div>
          
        }
        )}
      </main>
    </div>
  )
}
