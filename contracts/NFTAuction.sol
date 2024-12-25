// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/InterfaceNFTAuction.sol";
import "./interfaces/InterfaceERC721.sol";
import "./NFT.sol";
import "./interfaces/Pausable.sol";
import "./interfaces/Ownable.sol";

contract NFTAuction is Ownable, Pausable, InterfaceNFTAuction {
    mapping(uint256 => Auction) private _auctions;
    mapping(address => uint256[]) private _userAuctions;
    mapping(address => bool) public whitelistedCollections; 

    uint256 public creationFee;
    uint256 public bidFee;
    uint256 public finalizePercentage;
    uint256 public minAuctionDuration;
    uint256 public maxAuctionDuration;

    InterfaceERC721 private _nftContract;

    constructor(address nftContractAddress, uint256 _creationFee, uint256 _bidFee, uint256 _finalizePercentage, uint256 _minDuration, uint256 _maxDuration) {
        require(nftContractAddress != address(0), "Invalid NFT contract address");
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
        _nftContract.transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(tokenId, msg.sender, startingPrice, duration);
    }

    function placeBid(uint256 tokenId) external override payable whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(block.timestamp < auction.startTime + auction.duration, "Auction has ended");
        require(msg.value > auction.highestBid + bidFee, "Bid amount too low");

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);  // Refund previous bidder
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value - bidFee; // Subtract bid fee

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    // End auction and transfer NFT to the winner
    function endAuction(uint256 tokenId) external override whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(block.timestamp >= auction.startTime + auction.duration, "Auction is still ongoing");

        auction.active = false;

        if (auction.highestBid >= auction.reservePrice) {
            uint256 finalFee = (auction.highestBid * finalizePercentage) / 10000;  // Fee calculation
            uint256 sellerAmount = auction.highestBid - finalFee;

            _nftContract.transferFrom(address(this), auction.highestBidder, tokenId);
            payable(auction.seller).transfer(sellerAmount);
            payable(owner()).transfer(finalFee); // Transfer fee to the contract owner

            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            _nftContract.transferFrom(address(this), auction.seller, tokenId);
            if (auction.highestBidder != address(0)) {
                payable(auction.highestBidder).transfer(auction.highestBid); // Refund bid
            }

            emit AuctionCancelled(tokenId);
        }
    }

    // Cancel auction, return NFT and refund bid if applicable
    function cancelAuction(uint256 tokenId) external override whenNotPaused {
        Auction storage auction = _auctions[tokenId];
        require(auction.active, "Auction is not active");
        require(auction.seller == msg.sender, "Caller is not the seller");

        auction.active = false;

        _nftContract.transferFrom(address(this), auction.seller, tokenId);

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid); // Refund highest bidder
        }

        emit AuctionCancelled(tokenId);
    }

    function getAuction(uint256 tokenId) external view override returns (Auction memory) {
        return _auctions[tokenId];
    }

    function getUserAuctions(address user) external view returns (uint256[] memory) {
        return _userAuctions[user];
    }

    function getRunningAuctions() external view returns (Auction[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _userAuctions[msg.sender].length; i++) {
            if (_auctions[_userAuctions[msg.sender][i]].active) {
                count++;
            }
        }

        Auction[] memory auctions = new Auction[](count);
        count = 0;
        for (uint256 i = 0; i < _userAuctions[msg.sender].length; i++) {
            if (_auctions[_userAuctions[msg.sender][i]].active) {
                auctions[count] = _auctions[_userAuctions[msg.sender][i]];
                count++;
            }
        }

        return auctions;
    }

}
