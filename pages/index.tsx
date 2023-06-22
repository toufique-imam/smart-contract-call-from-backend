import Head from 'next/head'
import clientPromise from '../lib/mongodb'
import type { InferGetServerSidePropsType, GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import { makeGetRequest, makePostRequest, parseServerResponse } from '../utils/MongodbUtils'
import 'bootstrap/dist/css/bootstrap.css'
import { get } from 'http'
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
  const [masterInfo, setMasterInfo] = useState<any>({})
  const [transactions, setTransactions] = useState<any>([])
  const [users, setUsers] = useState<any>([])
  const [isTransactionLoading, setTransactionIsLoading] = useState<boolean>(false)
  const [isMasterLoading, setMasterIsLoading] = useState<boolean>(false)
  const [isPaybackLoading, setPaybackIsLoading] = useState<boolean>(false)
  const [isWorking, setIsWorking] = useState<boolean>(false)
  const [userInputN, setUserInputN] = useState<number>(1)

  async function getTransaction() {
    setTransactionIsLoading(true)
    const response = await makeGetRequest('/api/get_transaction')
    try {
      const responseData: Array<any> = await parseServerResponse(response)
      setTransactions(responseData)
    } catch (e) {
      console.error(e)
    } finally {
      setTransactionIsLoading(false)
    }
  }
  async function getUsers() {
    setPaybackIsLoading(true)
    const response = await makeGetRequest('/api/get_ids')
    try {
      const responseData: Array<any> = await parseServerResponse(response)
      setUsers(responseData)
    } catch (e) {
      console.error(e)
    } finally {
      setPaybackIsLoading(false)
    }
  }
  async function getMasterInfo() {
    setMasterIsLoading(true)
    const response = await makeGetRequest('/api/get_master_info')
    try {
      const responseData = await parseServerResponse(response)
      setMasterInfo(responseData)
    } catch (e) {
      console.error(e)
    } finally {
      setMasterIsLoading(false)
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
    // show a modal with user interaction off
    setIsWorking(true)
    try {
      const response = await makePostRequest('/api/make_transaction', JSON.stringify(body))
      await parseServerResponse(response)
      alert("Transaction made")
      getUsers()
      getTransaction()
      getMasterInfo()
    } catch (e) {
      console.error(e)
      alert("Error making transaction")
    } finally {
      setIsWorking(false)
    }
  }
  async function deleteTransactions() {
    const body = {
    }
    setIsWorking(true)
    try {
      const response = await makePostRequest('/api/delete_transaction', JSON.stringify(body))
      await parseServerResponse(response)
      alert("Transactions deleted")
      getUsers()
      getTransaction()
      getMasterInfo()
    } catch (e) {
      console.error(e)
      alert("Error making transaction")
    } finally {
      setIsWorking(false)
    }
  }
  async function paybackTransactions(to: string) {
    const body = {
      to: to
    }
    setIsWorking(true)
    try {
      await makePostRequest('/api/payback_transaction', JSON.stringify(body))
      alert("payback made")
      getUsers()
      getTransaction()
      getMasterInfo()
    } catch (e) {
      console.error(e)
      alert("Error making transaction")
    } finally {
      setIsWorking(false)
    }
  }
  useEffect(() => {
    getUsers()
    getTransaction()
    getMasterInfo()
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

        <h1 className='title'> Master Info </h1>
        {isMasterLoading ?
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Getting main info ...</span>
          </div>
          :
          <table className='table  m-2 p-2'>
            <thead>
              <tr>
                <td scope='col'> Address </td>
                <td scope='col'> Balance </td>
                <td scope='col'> Got Balance </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{masterInfo.address}</td>
                <td>{masterInfo.balance}</td>
                <td>{masterInfo.gotbalance}</td>
              </tr>
            </tbody>
          </table>
        }
        <h1 className='title'> User Input </h1>
        <div className="input-group mb-3">
          <input type="number" onChange={handleUserInputN} min="1" max="15" className="form-control" placeholder="1" aria-label="Place a value" aria-describedby="button-addon2" />
          <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={makeTransaction} >Send</button>
        </div>

        <h1 className='title'> Past Transactions </h1>
        {isTransactionLoading ?
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Getting transactions ...</span>
          </div>
          : <>

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
          </>
        }

        <h1 className='title'> Payback </h1>
        {isPaybackLoading ?
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Getting users ...</span>
          </div>
          : <>
            <table className='table  m-2 p-2'>
              <thead>
                <tr>
                  <td scope='col'> Address </td>
                  <td scope='col'> Given amount </td>
                  <td scope='col'> Total amount </td>
                  <td scope='col'> Action </td>

                </tr>
              </thead>
              <tbody>
                {users.map((e: any) => (
                  <tr key={e._id}>
                    <td>{e.pub_address}</td>
                    <td>{e.usedBalance}</td>
                    <td>{e.balance}</td>
                    <td>
                      {e.usedBalance > 0 ?
                        <button className="btn btn-outline-secondary" type="button" id="button-addon2" onClick={() => paybackTransactions(e.pub_address)} >Payback</button>
                        :
                        <></>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        }
      </main>
    </div>
  )
}
