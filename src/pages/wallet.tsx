import type { NextPage } from 'next'
import WalletComponent from '../components/WalletComponent'
import TransactionList from '../components/TransactionList'
import { useWallet } from '../utils/Context'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const WalletPage: NextPage = () => {
  const { wallet } = useWallet()
  const router = useRouter()

  useEffect(() => {
    if (!wallet) {
      router.push('/')
    }
  }, [wallet, router])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <WalletComponent />
        <TransactionList />
      </div>
    </div>
  )
}

export default WalletPage