// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/InterfaceNFTAuction.sol";
import "./interfaces/Ownable.sol";

contract NFTAuctionRegistry is Ownable {
    // Storage
    mapping(uint256 => InterfaceNFTAuction.Auction) private _auctions;
    mapping(address => uint256[]) private _userAuctions;
    uint256[] private _activeAuctions;

    // Events
    event AuctionRegistered(uint256 indexed tokenId, address indexed seller);
    event AuctionUpdated(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionDeactivated(uint256 indexed tokenId);

    modifier onlyAuctionContract() {
        require(msg.sender == owner(), "Only auction contract");
        _;
    }

    function registerAuction(
        uint256 tokenId,
        address seller,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration
    ) external onlyAuctionContract {
        // Remove the check for seller == address(0) since we're now properly deleting auctions
        // Just check if the auction is currently active
        require(!_auctions[tokenId].active, "Auction already exists");
        
        _auctions[tokenId] = InterfaceNFTAuction.Auction({
            seller: seller,
            tokenId: tokenId,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            duration: duration,
            startTime: block.timestamp,
            active: true,
            highestBidder: address(0),
            highestBid: 0
        });

        _userAuctions[seller].push(tokenId);
        _activeAuctions.push(tokenId);
        
        emit AuctionRegistered(tokenId, seller);
    }

    function updateAuctionBid(
        uint256 tokenId,
        address bidder,
        uint256 bidAmount
    ) external onlyAuctionContract {
        require(_auctions[tokenId].active, "Auction not active");
        _auctions[tokenId].highestBidder = bidder;
        _auctions[tokenId].highestBid = bidAmount;
        emit AuctionUpdated(tokenId, bidder, bidAmount);
    }

    function deactivateAuction(uint256 tokenId) external onlyAuctionContract {
        require(_auctions[tokenId].active, "Auction not active");
        
        // Store seller address before deleting auction data
        address seller = _auctions[tokenId].seller;
        
        // Remove from active auctions
        _removeFromActiveAuctions(tokenId);
        
        // Remove from user auctions
        _removeFromUserAuctions(tokenId, seller);
        
        // Completely delete the auction
        delete _auctions[tokenId];
        
        emit AuctionDeactivated(tokenId);
    }

    function updateAuctionParameters(
        uint256 tokenId,
        uint256 newReservePrice,
        uint256 newDuration
    ) external onlyAuctionContract {
        require(_auctions[tokenId].active, "Auction not active");
        _auctions[tokenId].reservePrice = newReservePrice;
        _auctions[tokenId].duration = newDuration;
    }

    function getAuction(uint256 tokenId) external view returns (InterfaceNFTAuction.Auction memory) {
        return _auctions[tokenId];
    }

    function getUserAuctions(address user) external view returns (InterfaceNFTAuction.Auction[] memory) {
        uint256[] memory userAuctionIds = _userAuctions[user];
        InterfaceNFTAuction.Auction[] memory auctions = new InterfaceNFTAuction.Auction[](userAuctionIds.length);
        
        for(uint256 i = 0; i < userAuctionIds.length; i++) {
            auctions[i] = _auctions[userAuctionIds[i]];
        }
        
        return auctions;
    }

    function getAllActiveAuctions() external view returns (InterfaceNFTAuction.Auction[] memory) {
        uint256 activeCount = 0;
        
        // Count truly active auctions (not expired)
        for(uint256 i = 0; i < _activeAuctions.length; i++) {
            InterfaceNFTAuction.Auction memory auction = _auctions[_activeAuctions[i]];
            if (auction.active && block.timestamp < auction.startTime + auction.duration) {
                activeCount++;
            }
        }
        
        InterfaceNFTAuction.Auction[] memory activeAuctions = new InterfaceNFTAuction.Auction[](activeCount);
        uint256 index = 0;
        
        // Fill array with active auctions
        for(uint256 i = 0; i < _activeAuctions.length && index < activeCount; i++) {
            InterfaceNFTAuction.Auction memory auction = _auctions[_activeAuctions[i]];
            if (auction.active && block.timestamp < auction.startTime + auction.duration) {
                activeAuctions[index] = auction;
                index++;
            }
        }
        
        return activeAuctions;
    }

    function _removeFromActiveAuctions(uint256 tokenId) internal {
        for (uint256 i = 0; i < _activeAuctions.length; i++) {
            if (_activeAuctions[i] == tokenId) {
                _activeAuctions[i] = _activeAuctions[_activeAuctions.length - 1];
                _activeAuctions.pop();
                break;
            }
        }
    }

    function _cleanupAuction(uint256 tokenId) internal {
        uint256[] storage userAuctions = _userAuctions[_auctions[tokenId].seller];
        for(uint256 i = 0; i < userAuctions.length; i++) {
            if(userAuctions[i] == tokenId) {
                userAuctions[i] = userAuctions[userAuctions.length - 1];
                userAuctions.pop();
                break;
            }
        }
    }

    function _removeFromUserAuctions(uint256 tokenId, address seller) internal {
        uint256[] storage userAuctions = _userAuctions[seller];
        for(uint256 i = 0; i < userAuctions.length; i++) {
            if(userAuctions[i] == tokenId) {
                userAuctions[i] = userAuctions[userAuctions.length - 1];
                userAuctions.pop();
                break;
            }
        }
    }
}