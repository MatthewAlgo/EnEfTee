'use client';

import React, { useState } from 'react';
import { AuthProvider } from '../../context/authcontext';
import { useAuth } from '../../context/authcontext';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import { ethers } from 'ethers';
import { createNFTContract } from '../../utils/nft_contract'; // Import the contract utility

// NFT Contract Address (replace with your deployed contract address)
const NFT_CONTRACT_ADDRESS = 'YOUR_DEPLOYED_NFT_CONTRACT_ADDRESS';

export default function CreateNFT() {
  return (
    <AuthProvider>
      <CreateNFTContent />
    </AuthProvider>
  );
}

function CreateNFTContent() {
  const { isAuthenticated, isConnecting, provider } = useAuth();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file || !name || !symbol || !description) {
      alert('Please fill out all fields and upload a file.');
      return;
    }

    try {
      setIsMinting(true);

      // Ensure we have a provider and signer
      if (!provider) {
        throw new Error('No provider available');
      }
      const signer = await provider.getSigner();

      // Upload the file first
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      const { ipfsUrl } = await uploadResponse.json();
      const nftContract = createNFTContract(NFT_CONTRACT_ADDRESS, signer);
      const tokenId = ethers.getBigInt(Date.now());

      // Prepare metadata for the token
      const tokenMetadata = JSON.stringify({
        name,
        symbol,
        description,
        image: ipfsUrl
      });
      // Mint the NFT on-chain
      const tx = await nftContract.mintWithMetadata(
        await signer.getAddress(), 
        tokenId, 
        tokenMetadata
      );
      const receipt = await tx.wait();
      if (receipt) {
        alert('NFT successfully created and minted on-chain!');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while creating the NFT: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsMinting(false);
    }
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900">
        <p className="text-white text-lg">Connecting...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900">
        <Header onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-white text-lg">Please log in to create an NFT.</p>
        </main>
        <Footer />
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Create a New NFT</h1>
        <form onSubmit={handleSubmit} className="bg-gray-800/30 rounded-2xl p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
              NFT Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter the name of your NFT"
              required
            />
          </div>

          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-400 mb-1">
              NFT Symbol
            </label>
            <input
              id="symbol"
              type="text"
              value={symbol} // Bind the symbol state
              onChange={(e) => setSymbol(e.target.value)} // Update the symbol state
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter the symbol for your NFT"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter a description for your NFT"
              rows={4}
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-400 mb-1">
              Upload File
            </label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="w-full text-gray-400 bg-gray-800 file:bg-purple-500 file:text-white file:px-4 file:py-2 file:rounded-lg hover:file:bg-purple-600 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isMinting}
            className="w-full px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition duration-300 disabled:opacity-50"
          >
            {isMinting ? 'Minting...' : 'Create NFT'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
