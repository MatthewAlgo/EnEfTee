'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface AuthContextType {
  isAuthenticated: boolean;
  walletAddress: string | null;
  chainId: number | null;
  balance: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  error: string | null;
  isConnecting: boolean;
  provider: ethers.BrowserProvider | null; 
  signer: ethers.JsonRpcSigner | null; 
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  walletAddress: null,
  chainId: null,
  balance: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  error: null,
  isConnecting: false,
  provider: null,
  signer: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const checkIfWalletIsInstalled = () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      setError('Please install MetaMask to use this feature');
      return false;
    }
    return true;
  };

  const getBalance = async (address: string) => {
    try {
      if (!provider) return null;
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  };

  const connectWallet = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (!checkIfWalletIsInstalled()) {
        setIsConnecting(false);
        return;
      }

      const { ethereum } = window as any;
      const newProvider = new ethers.BrowserProvider(ethereum);
      setProvider(newProvider);

      const accounts = await newProvider.send("eth_requestAccounts", []);
      const account = accounts[0];
      
      const newSigner = await newProvider.getSigner();
      setSigner(newSigner);

      const network = await newProvider.getNetwork();
      const accountBalance = await getBalance(account);

      setWalletAddress(account);
      setChainId(Number(network.chainId));
      setBalance(accountBalance);
      setIsAuthenticated(true);

      localStorage.setItem('walletAddress', account);
      localStorage.setItem('chainId', network.chainId.toString());
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      setIsAuthenticated(false);
      setProvider(null);
      setSigner(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setChainId(null);
    setBalance(null);
    setIsAuthenticated(false);
    setProvider(null);
    setSigner(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('chainId');
  };

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== walletAddress) {
      setWalletAddress(accounts[0]);
      getBalance(accounts[0]).then(newBalance => setBalance(newBalance));
    }
  }, [walletAddress, provider]);

  const handleChainChanged = useCallback((chainId: string) => {
    setChainId(Number(chainId));
  }, []);

  useEffect(() => {
    const initializeWallet = async () => {
      const savedAddress = localStorage.getItem('walletAddress');
      const savedChainId = localStorage.getItem('chainId');

      if (savedAddress && savedChainId && checkIfWalletIsInstalled()) {
        const { ethereum } = window as any;
        const newProvider = new ethers.BrowserProvider(ethereum);
        setProvider(newProvider);

        try {
          const accounts = await newProvider.listAccounts();
          if (accounts.length > 0 && accounts[0].address.toLowerCase() === savedAddress.toLowerCase()) {
            const newSigner = await newProvider.getSigner();
            setSigner(newSigner);

            const network = await newProvider.getNetwork();
            const accountBalance = await getBalance(savedAddress);

            setWalletAddress(savedAddress);
            setChainId(Number(network.chainId));
            setBalance(accountBalance);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Error initializing wallet:', error);
          disconnectWallet();
        } finally {
          setIsConnecting(false);
        }
      }
    };

    initializeWallet();
  }, []);

  useEffect(() => {
    if (checkIfWalletIsInstalled()) {
      const { ethereum } = window as any;

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  const value = {
    isAuthenticated,
    walletAddress,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    error,
    isConnecting,
    provider,
    signer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};