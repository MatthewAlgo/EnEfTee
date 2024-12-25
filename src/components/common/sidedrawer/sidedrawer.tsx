import React from 'react';
import { X, Home, Compass, Tag, BarChart2, Heart, Clock, Plus, Settings, HelpCircle, Wallet } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            EnEfTee
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Section */}
        <div className="p-4 border-b border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <NavItem icon={<Home />} label="Home" href="/" />
          <NavItem icon={<Compass />} label="Explore" href="/explore" />
          <NavItem icon={<Tag />} label="Live Auctions" href="/auctions" />
          <NavItem icon={<BarChart2 />} label="Rankings" href="/rankings" />
          <NavItem icon={<Heart />} label="Favorites" href="/favorites" />
          <NavItem icon={<Clock />} label="Activity" href="/activity" />
          <NavItem icon={<Plus />} label="Create" href="/create" />
        </nav>

        {/* Divider */}
        <div className="border-b border-gray-800 mx-4" />

        {/* Secondary Navigation */}
        <nav className="p-4 space-y-2">
          <NavItem icon={<Settings />} label="Settings" href="/settings" />
          <NavItem icon={<HelpCircle />} label="Help Center" href="/help" />
        </nav>

        {/* Stats Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard label="Floor Price" value="2.5 ETH" />
            <StatsCard label="Volume" value="120K ETH" />
          </div>
        </div>
      </div>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href }) => {
  return (
    <a 
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
};

interface StatsCardProps {
  label: string;
  value: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value }) => {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="font-bold text-purple-400">{value}</p>
    </div>
  );
};

export default SideDrawer;