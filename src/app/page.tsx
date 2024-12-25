'use client';

import React, { useState } from 'react';
import Header from '../components/common/header/header';
import Footer from '../components/common/footer/footer';
import Homepage from '../components/common/homepage/homepage';
import { AuthProvider, useAuth } from '../context/authcontext';
import SideDrawer from '../components/common/sidedrawer/sidedrawer';
import { TrendingUp, Clock, Flame } from 'lucide-react';

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

function MainContent() {
  const { isAuthenticated } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900">
      <Header onMenuClick={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      
      {isAuthenticated ? (
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-12">
            {/* Main Content Area */}
            <div className="md:col-span-8">
              {/* Featured Section */}
              <section className="bg-gray-800/30 rounded-2xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Featured Auctions</h2>
                <div className="grid gap-4">
                  <NFTCard />
                  <NFTCard />
                </div>
              </section>

              {/* Live Auctions */}
              <section className="bg-gray-800/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="text-purple-400" />
                  <h2 className="text-2xl font-bold text-white">Live Auctions</h2>
                </div>
                <div className="grid gap-4">
                  <NFTCard />
                  <NFTCard />
                  <NFTCard />
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-4 space-y-6">
              {/* Top Collections */}
              <div className="bg-gray-800/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Top Collections</h3>
                </div>
                <div className="space-y-4">
                  <CollectionItem rank={1} name="Crypto Punks" volume="1.2K ETH" change="+12.3%" />
                  <CollectionItem rank={2} name="Bored Apes" volume="950 ETH" change="+8.7%" />
                  <CollectionItem rank={3} name="Art Blocks" volume="820 ETH" change="+5.2%" />
                </div>
              </div>

              {/* Hot Bids */}
              <div className="bg-gray-800/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Hot Bids</h3>
                </div>
                <div className="space-y-4">
                  <NFTCard compact />
                  <NFTCard compact />
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <Homepage />
      )}
      <Footer />
    </div>
  );
}

const NFTCard = ({ compact = false }) => {
  return (
    <div className={`bg-gray-800/50 rounded-xl overflow-hidden hover:shadow-lg transition duration-300 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="aspect-square w-full bg-purple-900/50 rounded-lg mb-3">
        <img 
          src="/api/placeholder/400/400" 
          alt="NFT" 
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <div>
        <h3 className="text-white font-semibold mb-1">Crypto Art #1234</h3>
        <div className="flex justify-between items-center">
          <span className="text-purple-400">Current Bid</span>
          <span className="text-white font-bold">2.5 ETH</span>
        </div>
        {!compact && (
          <div className="mt-3 flex justify-between items-center text-sm">
            <span className="text-gray-400">Ends in: 12h 30m</span>
            <button className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition duration-300">
              Place Bid
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface CollectionItemProps {
  rank: number;
  name: string;
  volume: string;
  change: string;
}

const CollectionItem: React.FC<CollectionItemProps> = ({ rank, name, volume, change }) => {
  const isPositive = change.startsWith('+');
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition duration-300">
      <div className="flex items-center gap-3">
        <span className="text-gray-400">#{rank}</span>
        <div>
          <h4 className="text-white font-medium">{name}</h4>
          <span className="text-sm text-gray-400">Volume: {volume}</span>
        </div>
      </div>
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {change}
      </span>
    </div>
  );
};