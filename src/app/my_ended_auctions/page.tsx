'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AuthProvider, useAuth } from '../../context/authcontext';
import Header from '../../components/common/header/header';
import Footer from '../../components/common/footer/footer';
import { createNFTContract } from '../../utils/nft_contract';
import { createNFTAuctionContract } from '../../utils/nft_auction_contract';
import { CustomPlaceholder, generateCustomPlaceholderURL  } from 'react-placeholder-image';

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '';
const AUCTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || '';

type EndedAuctionNFT = {
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

export default function MyEndedAuctions() {
  return (
    <AuthProvider>
      <MyEndedAuctionsContent />
    </AuthProvider>
  );
}

function MyEndedAuctionsContent() {
  const { provider, isAuthenticated, isConnecting } = useAuth();
  const [auctions, setAuctions] = useState<EndedAuctionNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && provider) {
      loadEndedAuctions();
    }
  }, [isAuthenticated, provider]);

  const loadEndedAuctions = async () => {
    try {
      setIsLoading(true);
      const signer = await provider!.getSigner();
      const userAddress = await signer.getAddress();
      const auctionContract = createNFTAuctionContract(AUCTION_CONTRACT_ADDRESS, signer);
      const nftContract = createNFTContract(NFT_CONTRACT_ADDRESS, signer);

      const userAuctions = await auctionContract.getUserAuctions(userAddress);
      
      // Filter only inactive auctions where the user is the seller
      const endedAuctions = userAuctions.filter(auction => 
        auction.active && 
        auction.seller.toLowerCase() === userAddress.toLowerCase()
      );

      const auctionPromises = endedAuctions.map(async (auction) => {
        try {
          // Check if token exists
          try {
            await nftContract.ownerOf(auction.tokenId);
          } catch (error) {
            console.log(`Token ${auction.tokenId} does not exist, skipping...`);
            return null;
          }

          let metadata = {
            name: `NFT #${auction.tokenId}`,
            description: 'No description available',
            image: generateCustomPlaceholderURL(200, 200, {
                backgroundColor: '#123456',
                textColor: '#ffffff',
                text: auction.tokenId.toString(),
              })
          };

          try {
            const uri = await nftContract.tokenURI(auction.tokenId);
            const response = await fetch(uri);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            const fetchedMetadata = await response.json();
            
            // Only update metadata if we successfully fetched it
            metadata = {
              name: fetchedMetadata.name || metadata.name,
              description: fetchedMetadata.description || metadata.description,
              image: fetchedMetadata.image || metadata.image
            };
          } catch (error) {
            console.warn(`Failed to fetch metadata for token ${auction.tokenId}:`, error);
            // Continue with default metadata
          }
          
          return {
            tokenId: auction.tokenId.toString(),
            name: metadata.name,
            description: metadata.description,
            image: metadata.image,
            seller: auction.seller,
            startingPrice: auction.startingPrice,
            highestBid: auction.highestBid,
            highestBidder: auction.highestBidder,
            endTime: auction.startTime + auction.duration,
            active: auction.active
          };
        } catch (error) {
          console.error(`Error loading NFT ${auction.tokenId}:`, error);
          return null;
        }
      });

      const loadedAuctions = (await Promise.all(auctionPromises))
        .filter(Boolean) as EndedAuctionNFT[];
      
      setAuctions(loadedAuctions);
    } catch (error) {
      console.error('Error loading ended auctions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeAuction = async (tokenId: string) => {
    try {
      setProcessingAction(tokenId);
      const signer = await provider!.getSigner();
      const auctionContract = createNFTAuctionContract(AUCTION_CONTRACT_ADDRESS, signer);
      
      const tx = await auctionContract.finalizeExpiredAuction(tokenId);
      await tx.wait();
      
      await loadEndedAuctions();
    } catch (error) {
      console.error('Error finalizing auction:', error);
      alert('Failed to finalize auction: ' + (error as Error).message);
    } finally {
      setProcessingAction(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900">
        <Header onMenuClick={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-white text-center">Please connect your wallet to view your ended auctions.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900">
      <Header onMenuClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">My Ended Auctions</h1>

        {isLoading ? (
          <p className="text-white text-center">Loading your ended auctions...</p>
        ) : auctions.length === 0 ? (
          <p className="text-white text-center">You don't have any ended auctions.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <div key={auction.tokenId} className="bg-gray-800/30 rounded-xl p-4">
                <div className="relative">
                  {auction.image && (
                    <img 
                      src={auction.image} 
                      alt={auction.name} 
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = '/placeholder-nft.jpg';
                      }}
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-white text-xl font-bold flex justify-between items-center">
                    <span>{auction.name}</span>
                    <span className="text-sm text-gray-400">#{auction.tokenId}</span>
                  </h3>
                  
                  <div className="space-y-1">
                    <p className="text-purple-400">
                      Starting Price: {ethers.formatEther(auction.startingPrice)} ETH
                    </p>
                    <p className="text-purple-400">
                      Final Bid: {ethers.formatEther(auction.highestBid)} ETH
                    </p>
                    {auction.highestBidder !== ethers.ZeroAddress && (
                      <p className="text-gray-400">
                        Highest Bidder: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>

                  {auction.highestBid === 0n ? (
                    <button
                      onClick={() => handleFinalizeAuction(auction.tokenId)}
                      disabled={processingAction === auction.tokenId}
                      className="mt-4 w-full px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 disabled:bg-purple-400"
                    >
                      {processingAction === auction.tokenId ? 'Processing...' : 'Reclaim NFT'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFinalizeAuction(auction.tokenId)}
                      disabled={processingAction === auction.tokenId}
                      className="mt-4 w-full px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-green-400"
                    >
                      {processingAction === auction.tokenId ? 'Processing...' : 'Finalize Auction'}
                    </button>
                  )}
                </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
