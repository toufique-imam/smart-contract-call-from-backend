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
  const [transactions, setTransactions] = useState<any>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [userInputN, setUserInputN] = useState<number>(1)

  async function getTransaction() {
    setIsLoading(true)
    const response = await makeGetRequest('/api/get_transaction')
    try {
      const responseData: Array<any> = await parseServerResponse(response)
      setTransactions(responseData)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }
  function handleUserInputN(e: any) {
    setUserInputN(e.target.value)
  }

  async function makeTransaction() {
    if (userInputN < 1 || userInputN > 15) {
      alert("Please enter a value between 1 and 15")
      return
    }
    console.log(userInputN)
    const body = {
      n: userInputN
    }
    setIsLoading(true)
    try {
      const response = await makePostRequest('/api/make_transaction', JSON.stringify(body))
      await parseServerResponse(response)
      alert("Transaction made")
      // getAddresses()
      getTransaction()
    } catch (e) {
      console.error(e)
      alert("Error making transaction")
    } finally {
      setIsLoading(false)
    }
  }
  async function deleteTransactions() {
    const body = {
    }
    setIsLoading(true)
    try {
      const response = await makePostRequest('/api/delete_transaction', JSON.stringify(body))
      await parseServerResponse(response)
      alert("Transactions deleted")
      getTransaction()
    } catch (e) {
      console.error(e)
      alert("Error making transaction")
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
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
        {isLoading ?
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          : <></>}

        {/* an input box with a send button */}
        <div className="input-group mb-3">
          <input type="number" onChange={handleUserInputN} min="1" max="15" className="form-control" placeholder="1" aria-label="Place a value" aria-describedby="button-addon2" />
          <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={makeTransaction} >Send</button>
        </div>

        <h1 className='title'> Past Transactions </h1>
        <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={deleteTransactions} >Delete Transactions</button>
        <table className='table  m-2 p-2'>
          <thead>
            <tr>
              <td scope='col'> Timestamp </td>
              <td scope='col'> FROM </td>
              <td scope='col'> TO </td>
              <td scope='col'> amount </td>
              <td scope='col'> txHash </td>
            </tr>
          </thead>
          <tbody>
            {transactions.map((e: any) => (
              <tr key={e._id}>
                <td>{e.timeStamp}</td>
                <td>{e.from.slice(0, 4) + '...' + e.from.slice(-4)}</td>
                <td>{e.to.slice(0, 4) + '...' + e.to.slice(-4)}</td>
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
