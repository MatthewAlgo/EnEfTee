import { useWallet } from '../utils/Context'
import { useRouter } from 'next/router'

const Welcome = () => {
  const { initializeWallet } = useWallet()
  const router = useRouter()

  const handleConnect = async () => {
    await initializeWallet()
    router.push('/wallet')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome to Web3 Wallet</h1>
        <p className="text-gray-600 mb-8 text-center">
          Connect your MetaMask wallet to get started
        </p>
        <button
          onClick={handleConnect}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  )
}

export default Welcome