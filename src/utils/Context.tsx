import React, { createContext, useContext, useState } from 'react';
import { BrowserProvider, Signer } from 'ethers';

declare global {
  interface Window {
    ethereum: any;
  }
}

interface WalletContextType {
  wallet: Signer | null;
  initializeWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  initializeWallet: async () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<Signer | null>(null);

  const initializeWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      try {
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setWallet(signer);
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      }
    }
  };

  return (
    <WalletContext.Provider value={{ wallet, initializeWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);