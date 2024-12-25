import React, { useState, useEffect } from 'react';
import { Wallet, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/authcontext'; // Adjust the import path as needed

interface HeaderProps {
    onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
    const router = useRouter();
    const [currentPath, setCurrentPath] = useState('');
    const { isAuthenticated, walletAddress, connectWallet, disconnectWallet, isConnecting } = useAuth();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
        }
    }, []);

    const handleWalletButtonClick = async () => {
        if (isAuthenticated) {
            disconnectWallet();
        } else {
            await connectWallet();
        }
    };

    // Handle logo click to redirect to homepage
    const handleLogoClick = () => {
        router.push('/');
    };

    return (
        <header className="bg-gradient-to-r from-gray-900 to-purple-900 text-white p-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
                    <h1 className="text-3xl font-bold">
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                            EnEfTee
                        </span>
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="hidden md:flex space-x-8">
                    <NavLink href="/explore" label="Explore" />
                    <NavLink href="/auctions" label="Live Auctions" />
                    <NavLink href="/create" label="Create" />
                    <NavLink href="/collections" label="Collections" />
                </nav>

                {/* Right Section */}
                <div className="flex items-center space-x-4">

                    {/* Connect Wallet Button */}
                    <button
                        onClick={handleWalletButtonClick}
                        disabled={isConnecting}
                        className={`hidden md:flex items-center px-4 py-2 rounded-lg transition duration-300 ${
                            isAuthenticated
                                ? 'bg-purple-600 hover:bg-purple-700'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                        }`}
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        {isAuthenticated
                            ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
                            : isConnecting
                            ? 'Connecting...'
                            : 'Connect Wallet'}
                    </button>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 hover:bg-purple-800/50 rounded-full transition duration-300">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

interface NavLinkProps {
    href: string;
    label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <a
            href={href}
            className="relative py-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="text-gray-200 hover:text-white transition duration-300">
                {label}
            </span>
            <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 transform origin-left transition-transform duration-300 ${
                    isHovered ? 'scale-x-100' : 'scale-x-0'
                }`}
            />
        </a>
    );
};

export default Header;
