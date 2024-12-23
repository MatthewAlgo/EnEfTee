import { useEffect, useState } from 'react'
import { useWallet } from '../utils/Context'
import { getTransactions, Transaction } from '../utils/EthersUtils'

const TransactionList = () => {
  const { wallet } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!wallet) return
      
      setLoading(true)
      try {
        const txs = await getTransactions(wallet)
        setTransactions(txs)
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      }
      setLoading(false)
    }

    fetchTransactions()
  }, [wallet])

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.hash} className="border rounded-lg p-4 hover:bg-gray-50">
            <p className="text-sm text-gray-500">Hash: {tx.hash}</p>
            <p className="text-sm text-gray-500">Block: {tx.blockNumber}</p>
            <p className="text-sm text-gray-500">
              Time: {new Date(tx.timestamp * 1000).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Gas Used: {tx.gasUsed.toString()}</p>
            <p className="text-sm text-gray-500">Value: {tx.value} ETH</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TransactionList