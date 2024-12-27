// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/InterfaceNFTAuction.sol";
import "./interfaces/InterfaceERC721.sol";
import "./NFT.sol";
import "./interfaces/Pausable.sol";
import "./interfaces/Ownable.sol";

contract NFTAuction is Ownable, Pausable, InterfaceNFTAuction {
    InterfaceERC721 private _nftContract;
    
    mapping(uint256 => Auction) private _auctions;
    mapping(address => uint256[]) private _userAuctions;
    mapping(address => bool) public whitelistedCollections;
    
    uint256[] private _activeAuctions;
    
    uint256 public creationFee;
    uint256 public bidFee;
    uint256 public finalizePercentage;
    uint256 public minAuctionDuration;
    uint256 public maxAuctionDuration;
    uint256 public minBidIncrement = 500; 
    
    event CreationFeeUpdated(uint256 newFee);
    event BidFeeUpdated(uint256 newFee);
    event FinalizePercentageUpdated(uint256 newPercentage);
    event MinBidIncrementUpdated(uint256 newIncrement);
    event AuctionParametersUpdated(uint256 tokenId, uint256 newReservePrice, uint256 newDuration);

    constructor(
        address nftContractAddress,
        uint256 _creationFee,
        uint256 _bidFee,
        uint256 _finalizePercentage,
        uint256 _minDuration,
        uint256 _maxDuration
    ) {
        require(nftContractAddress != address(0), "Invalid NFT contract address");
        require(_minDuration > 0 && _maxDuration > _minDuration, "Invalid duration parameters");
        require(_finalizePercentage <= 10000, "Invalid percentage");
        
        _nftContract = InterfaceERC721(nftContractAddress);
        creationFee = _creationFee;
        bidFee = _bidFee;
        finalizePercentage = _finalizePercentage;
        minAuctionDuration = _minDuration;
        maxAuctionDuration = _maxDuration;
    }

    function whitelistCollection(address collection, bool status) external onlyOwner {
        require(collection != address(0), "Invalid collection address");
        whitelistedCollections[collection] = status;
        emit CollectionWhitelistUpdated(collection, status);
    }

    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration
    ) external payable override whenNotPaused {
        require(whitelistedCollections[address(_nftContract)], "Collection not whitelisted");
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(duration >= minAuctionDuration && duration <= maxAuctionDuration, "Invalid auction duration");
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(reservePrice >= startingPrice, "Reserve price must be >= starting price");
        require(_nftContract.ownerOf(tokenId) == msg.sender, "Caller is not token owner");
        require(_nftContract.getApproved(tokenId) == address(this), "Contract not approved");

        Auction storage auction = _auctions[tokenId];
        require(!auction.active, "Auction already exists");

        _auctions[tokenId] = Auction({
            seller: msg.sender,
            tokenId: tokenId,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            duration: duration,
            startTime: block.timestamp,
            active: true,
            highestBidder: address(0),
            highestBid: 0
        });

        _userAuctions[msg.sender].push(tokenId);
        _activeAuctions.push(tokenId);
        _nftContract.transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(tokenId, msg.sender, startingPrice, duration);
    }

    function placeBid(uint256 tokenId) external override payable whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        
        // Check if auction has ended and finalize it if needed
        if (block.timestamp >= auction.startTime + auction.duration) {
            _finalizeAuction(auction);
            revert("Auction has ended");
        }

        uint256 minBidAmount = auction.highestBid == 0 
            ? auction.startingPrice 
            : auction.highestBid + ((auction.highestBid * minBidIncrement) / 10000);
            
        require(msg.value >= minBidAmount + bidFee, "Bid amount too low");

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value - bidFee;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    // New function to check and finalize expired auctions
    function finalizeExpiredAuction(uint256 tokenId) external whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(block.timestamp >= auction.startTime + auction.duration, "Auction still ongoing");
        
        _finalizeAuction(auction);
    }

    // New internal function to handle auction finalization
    function _finalizeAuction(Auction storage auction) internal {
        require(auction.active, "Auction is not active");
        
        auction.active = false;
        _removeFromActiveAuctions(auction.tokenId);

        if (auction.highestBid >= auction.reservePrice && auction.highestBidder != address(0)) {
            // Transfer NFT to highest bidder
            uint256 finalFee = (auction.highestBid * finalizePercentage) / 10000;
            uint256 sellerAmount = auction.highestBid - finalFee;

            _nftContract.transferFrom(address(this), auction.highestBidder, auction.tokenId);
            payable(auction.seller).transfer(sellerAmount);
            payable(owner()).transfer(finalFee);

            emit AuctionEnded(auction.tokenId, auction.highestBidder, auction.highestBid);
        } else {
            // Return NFT to seller if no valid bids
            _nftContract.transferFrom(address(this), auction.seller, auction.tokenId);
            if (auction.highestBidder != address(0)) {
                payable(auction.highestBidder).transfer(auction.highestBid);
            }
            emit AuctionCancelled(auction.tokenId);
        }

        _cleanupAuction(auction.tokenId);
    }

    // Modify endAuction to use _finalizeAuction
    function endAuction(uint256 tokenId) external override whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(
            block.timestamp >= auction.startTime + auction.duration ||
            msg.sender == owner() ||
            msg.sender == auction.seller,
            "Auction cannot be ended yet"
        );

        _finalizeAuction(auction);
    }

    function updateAuctionParameters(
        uint256 tokenId,
        uint256 newReservePrice,
        uint256 newDuration
    ) external whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(msg.sender == auction.seller, "Only seller can update parameters");
        require(auction.highestBid == 0, "Cannot update after bids received");
        require(newDuration >= minAuctionDuration && newDuration <= maxAuctionDuration, "Invalid duration");
        require(newReservePrice >= auction.startingPrice, "Reserve price must be >= starting price");

        auction.reservePrice = newReservePrice;
        auction.duration = newDuration;

        emit AuctionParametersUpdated(tokenId, newReservePrice, newDuration);
    }

    function getAllActiveAuctions() external view returns (Auction[] memory) {
        Auction[] memory activeAuctions = new Auction[](_activeAuctions.length);
        for (uint256 i = 0; i < _activeAuctions.length; i++) {
            activeAuctions[i] = _auctions[_activeAuctions[i]];
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

    function cancelAuction(uint256 tokenId) external override whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(msg.sender == auction.seller || msg.sender == owner(), "Not authorized");
        require(auction.highestBid == 0, "Cannot cancel auction with bids");

        auction.active = false;
        _removeFromActiveAuctions(tokenId);
        _nftContract.transferFrom(address(this), auction.seller, tokenId);
        emit AuctionCancelled(tokenId);
    }

    function getAuction(uint256 tokenId) external view override returns (Auction memory) {
        return _auctions[tokenId];
    }
    function updateCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    function updateBidFee(uint256 newFee) external onlyOwner {
        bidFee = newFee;
        emit BidFeeUpdated(newFee);
    }

    function updateFinalizePercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 10000, "Invalid percentage"); // Max 100%
        finalizePercentage = newPercentage;
        emit FinalizePercentageUpdated(newPercentage);
    }

    function updateMinBidIncrement(uint256 newIncrement) external onlyOwner {
        require(newIncrement > 0 && newIncrement <= 5000, "Invalid increment"); // Max 50%
        minBidIncrement = newIncrement;
        emit MinBidIncrementUpdated(newIncrement);
    }
    function emergencyWithdraw(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        recipient.transfer(amount);
    }

    function emergencyWithdrawNFT(uint256 tokenId, address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        _nftContract.transferFrom(address(this), recipient, tokenId);
    }
    function getUserAuctions(address user) external view returns (Auction[] memory) {
        uint256[] memory userAuctionIds = _userAuctions[user];
        Auction[] memory auctions = new Auction[](userAuctionIds.length);
        
        for(uint256 i = 0; i < userAuctionIds.length; i++) {
            auctions[i] = _auctions[userAuctionIds[i]];
        }
        
        return auctions;
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
}