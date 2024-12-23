import { Signer, parseUnits, formatEther } from 'ethers';

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  gasUsed: bigint;
  value: string;
}

export const sendTransaction = async (
  wallet: Signer,
  to: string,
  amount: string
): Promise<string> => {
  const tx = await wallet.sendTransaction({
    to,
    value: parseUnits(amount, 'ether')
  });
  return tx.hash;
};

export const getTransactions = async (
  wallet: Signer,
): Promise<Transaction[]> => {
  const address = await wallet.getAddress();
  const provider = wallet.provider;
  if (!provider) {
    throw new Error('Provider is not available');
  }
  
  // Replace with your Etherscan API key
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
  const network = 'sepolia';
  
  const response = await fetch(
    `https://api-${network}.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${apiKey}`
  );
  
  const data = await response.json();
  
  return Promise.all(
    data.result.map(async (tx: any) => {
      const block = await provider.getBlock(tx.blockNumber);
      return {
        hash: tx.hash,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: block?.timestamp || 0,
        gasUsed: BigInt(tx.gasUsed),
        value: formatEther(tx.value)
      };
    })
  );
};