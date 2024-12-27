'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AuthProvider, useAuth } from '../../context/authcontext';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import { createNFTContract } from '../../utils/nft_contract';
import { createNFTAuctionContract } from '../../utils/nft_auction_contract';

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '';
const AUCTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || '';

type AuctionNFT = {
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  seller: string;
  startingPrice: bigint;
  highestBid: bigint;
  highestBidder: string;
  endTime: bigint;
  active: boolean;
};

export default function Auctions() {
  return (
    <AuthProvider>
      <AuctionsContent />
    </AuthProvider>
  );
}

function AuctionsContent() {
  const { isAuthenticated, isConnecting, provider } = useAuth();
  const [auctions, setAuctions] = useState<AuctionNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<AuctionNFT | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});

  const finalizeAuction = async (tokenId: string) => {
    try {
      const signer = await provider!.getSigner();
      const auctionContract = createNFTAuctionContract(AUCTION_CONTRACT_ADDRESS, signer);
      await auctionContract.finalizeExpiredAuction(tokenId);
      await loadAuctions();
    } catch (error) {
      console.error('Error finalizing auction:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && provider) {
      loadAuctions();
    }
  }, [isAuthenticated, provider]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const newTimeLeft: {[key: string]: string} = {};
      
      auctions.forEach(auction => {
        if (auction.endTime > now) {
          const diff = Number(auction.endTime - now);
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const seconds = diff % 60;
          newTimeLeft[auction.tokenId] = `${hours}h ${minutes}m ${seconds}s`;
        } else {
          newTimeLeft[auction.tokenId] = 'Ended';
        }
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [auctions]);

  useEffect(() => {
    const checkAndFinalizeExpiredAuctions = async () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      auctions.forEach(async (auction) => {
        if (auction.active && auction.endTime <= now) {
          await finalizeAuction(auction.tokenId);
        }
      });
    };

    if (auctions.length > 0) {
      checkAndFinalizeExpiredAuctions();
    }
  }, [auctions]);

  const loadAuctions = async () => {
    try {
      setIsLoading(true);
      const signer = await provider!.getSigner();
      const auctionContract = createNFTAuctionContract(AUCTION_CONTRACT_ADDRESS, signer);
      const nftContract = createNFTContract(NFT_CONTRACT_ADDRESS, signer);

      const activeAuctions = await auctionContract.getAllActiveAuctions();
      
      const auctionPromises = activeAuctions.map(async (auction) => {
        const uri = await nftContract.tokenURI(auction.tokenId);
        const metadata = await fetch(uri).then(res => res.json()).catch(() => ({}));
        
        return {
          tokenId: auction.tokenId.toString(),
          name: metadata.name || `NFT #${auction.tokenId}`,
          description: metadata.description || 'No description available',
          image: metadata.image,
          seller: auction.seller,
          startingPrice: auction.startingPrice,
          highestBid: auction.highestBid,
          highestBidder: auction.highestBidder,
          endTime: auction.startTime + auction.duration,
          active: auction.active
        };
      });

      const loadedAuctions = await Promise.all(auctionPromises);
      setAuctions(loadedAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const placeBid = async (auction: AuctionNFT) => {
    try {
      if (!bidAmount) {
        alert('Please enter a bid amount');
        return;
      }

      const signer = await provider!.getSigner();
      const auctionContract = createNFTAuctionContract(AUCTION_CONTRACT_ADDRESS, signer);

      const minBidAmount = auction.highestBid === 0n ? 
        auction.startingPrice : 
        auction.highestBid + (auction.highestBid * BigInt(500)) / BigInt(10000);

      if (ethers.parseEther(bidAmount) < minBidAmount) {
        alert('Bid amount too low');
        return;
      }

      const tx = await auctionContract.placeBid(
        auction.tokenId,
        { value: ethers.parseEther(bidAmount) }
      );

      await tx.wait();
      alert('Bid placed successfully!');
      setSelectedAuction(null);
      setBidAmount('');
      loadAuctions(); 
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid: ' + (error as Error).message);
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
        <Header onMenuClick={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-white text-center">Please connect your wallet to view auctions.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900">
      <Header onMenuClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Active Auctions</h1>

        {isLoading ? (
          <p className="text-white text-center">Loading auctions...</p>
        ) : auctions.length === 0 ? (
          <p className="text-white text-center">No active auctions available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <div key={auction.tokenId} className="bg-gray-800/30 rounded-xl p-4">
                {auction.image && (
                  <img src={auction.image} alt={auction.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                <h3 className="text-white text-xl font-bold">{auction.name}</h3>
                <p className="text-gray-400 mt-2">{auction.description}</p>
                <div className="mt-4 space-y-2">
                  <p className="text-purple-400">Current Bid: {ethers.formatEther(auction.highestBid)} ETH</p>
                  <p className="text-purple-400">Time Left: {timeLeft[auction.tokenId]}</p>
                  <p className="text-gray-400">Seller: {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}</p>
                  {auction.highestBidder !== ethers.ZeroAddress && (
                    <p className="text-gray-400">
                      Highest Bidder: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedAuction(auction)}
                  className="mt-4 w-full px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600"
                >
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedAuction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">
                Place Bid for {selectedAuction.name}
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                placeBid(selectedAuction);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Bid Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white"
                    required
                    min={ethers.formatEther(selectedAuction.highestBid)}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600"
                  >
                    Place Bid
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAuction(null)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
