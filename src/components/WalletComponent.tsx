import { useState, useEffect } from 'react'
import { useWallet } from '../utils/Context'
import { sendTransaction } from '../utils/EthersUtils'
import { formatEther } from 'ethers'

const WalletComponent = () => {
  const { wallet } = useWallet()
  const [balance, setBalance] = useState<string>('0')
  const [address, setAddress] = useState<string>('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)

  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (wallet) {
        const address = await wallet.getAddress()
        const balance = wallet.provider ? formatEther(await wallet.provider.getBalance(address)) : '0'
        setAddress(address)
        setBalance(balance)
      }
    }
    fetchWalletInfo()
  }, [wallet])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return
    
    setIsTransferring(true)
    try {
      await sendTransaction(wallet, recipientAddress, amount)
      setRecipientAddress('')
      setAmount('')
    } catch (error) {
      console.error('Transfer failed:', error)
    }
    setIsTransferring(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Wallet Info</h2>
        <p className="text-gray-600">Address: {address}</p>
        <p className="text-gray-600">Balance: {balance} ETH</p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Amount (ETH)</label>
          <input
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isTransferring}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isTransferring ? 'Transferring...' : 'Transfer ETH'}
        </button>
      </form>
    </div>
  )
}

export default WalletComponent