import React from 'react';
import { Wallet, Gem, Clock } from 'lucide-react';
import { useAuth } from '../../../context/authcontext';

const Homepage = () => {
  const {
    connectWallet,
    disconnectWallet,
    walletAddress,
    isAuthenticated,
    isConnecting,
  } = useAuth();

  const handleWalletClick = () => {
    if (isAuthenticated) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          EnEfTee Auctions
        </h1>
        <p className="text-2xl mb-8 text-purple-200">
          Discover, Bid, and Collect Rare Digital Art
        </p>
        <div className="flex gap-4 mb-12">
          
          <button
            onClick={handleWalletClick}
            className={`px-8 py-3 border-2 rounded-lg transition duration-300 ${
              isAuthenticated
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'border-purple-500 hover:bg-purple-500/20'
            }`}
          >
            {isConnecting
              ? 'Connecting...'
              : isAuthenticated
              ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
              : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center">Why Choose EnEfTee Auctions</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Wallet className="w-8 h-8 text-purple-400" />}
            title="Secure Transactions"
            description="Built on blockchain technology ensuring transparent and secure ownership transfer"
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8 text-purple-400" />}
            title="Live Auctions"
            description="Real-time bidding with instant notifications and automatic bid updates"
          />
          <FeatureCard
            icon={<Gem className="w-8 h-8 text-purple-400" />}
            title="Rare Collections"
            description="Curated selection of exclusive digital art from renowned artists"
          />
        </div>
      </div>

      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Collecting?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of collectors in the world's most exciting NFT marketplace
          </p>
          <button
            onClick={() => console.log('Launch App clicked!')}
            className="px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition duration-300"
          >
            Launch App
          </button>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="p-6 bg-purple-800/20 rounded-lg hover:bg-purple-800/30 transition duration-300">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-purple-200">{description}</p>
  </div>
);

interface StatCardProps {
  number: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ number, label }) => (
  <div className="p-4">
    <div className="text-3xl font-bold mb-2 text-purple-400">{number}</div>
    <div className="text-purple-200">{label}</div>
  </div>
);

export default Homepage;
