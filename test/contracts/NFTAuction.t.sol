// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../contracts/NFTAuction.sol";
import "../../contracts/NFT.sol";
import "../../contracts/NFTRegistry.sol";
import "../../contracts/NFTAuctionRegistry.sol";
import "../../contracts/UserRecords.sol";

contract NFTAuctionTest is Test {
    NFTAuction public auction;
    NFT public nft;
    NFTRegistry public nftRegistry;
    NFTAuctionRegistry public auctionRegistry;
    UserRecords public userRecords;
    
    address public owner;
    address public seller;
    address public bidder1;
    address public bidder2;
    
    uint256 public constant CREATION_FEE = 0.1 ether;
    uint256 public constant BID_FEE = 0.05 ether;
    uint256 public constant FINALIZE_PERCENTAGE = 250;
    uint256 public constant MIN_DURATION = 30;
    uint256 public constant MAX_DURATION = 604800;
    uint256 public constant TOKEN_ID = 1;
    
    function setUp() public {
        owner = address(this);
        seller = address(0x1);
        bidder1 = address(0x2);
        bidder2 = address(0x3);
        
        nftRegistry = new NFTRegistry();
        auctionRegistry = new NFTAuctionRegistry();
        userRecords = new UserRecords();
        nft = new NFT("TestNFT", "TNFT", address(nftRegistry), address(userRecords));
        
        auction = new NFTAuction(address(nft), CREATION_FEE, BID_FEE, FINALIZE_PERCENTAGE,
            MIN_DURATION, MAX_DURATION, address(userRecords), address(auctionRegistry));
        // Permisiunile
        nftRegistry.transferOwnership(address(nft));
        auctionRegistry.transferOwnership(address(auction));
        // Incarcam conturile cu ETH
        vm.deal(seller, 100 ether);
        vm.deal(bidder1, 100 ether);
        vm.deal(bidder2, 100 ether);
        // Mintam un NFT
        vm.startPrank(seller);
        nft.mintWithMetadata(seller, TOKEN_ID, "ipfs://test");
        nft.approve(address(auction), TOKEN_ID);
        vm.stopPrank();
    }

    function test_CreateAuction() public {
        uint256 startPrice = 1 ether;
        vm.startPrank(seller);
        auction.createAuction{value: CREATION_FEE}(
            TOKEN_ID,
            startPrice,
            MIN_DURATION
        );
        vm.stopPrank();

        InterfaceNFTAuction.Auction memory auctionData = auction.getAuction(TOKEN_ID);
        assertEq(auctionData.seller, seller);
        assertEq(auctionData.startingPrice, startPrice);
        assertTrue(auctionData.active);
    }

    function test_PlaceBid() public {
        vm.prank(seller);
        auction.createAuction{value: CREATION_FEE}(
            TOKEN_ID, 
            1 ether, 
            MIN_DURATION
        );
        
        vm.prank(bidder1);
        auction.placeBid{value: 1.5 ether + BID_FEE}(TOKEN_ID);
        
        InterfaceNFTAuction.Auction memory auctionData = auction.getAuction(TOKEN_ID);
        assertEq(auctionData.highestBidder, bidder1);
        assertEq(auctionData.highestBid, 1.5 ether);
    }

    function test_OutbidPreviousBidder() public {
        vm.prank(seller);
        auction.createAuction{value: CREATION_FEE}(
            TOKEN_ID, 
            1 ether, 
            MIN_DURATION
        );
        
        vm.prank(bidder1);
        auction.placeBid{value: 1.5 ether + BID_FEE}(TOKEN_ID);
        uint256 bidder1BalanceBefore = bidder1.balance;
        
        vm.prank(bidder2);
        auction.placeBid{value: 2 ether + BID_FEE}(TOKEN_ID);
        
        assertEq(bidder1.balance, bidder1BalanceBefore + 1.5 ether, "Refund amount incorrect");
        InterfaceNFTAuction.Auction memory auctionData = auction.getAuction(TOKEN_ID);
        assertEq(auctionData.highestBidder, bidder2);
        assertEq(auctionData.highestBid, 2 ether);
    }

    function testFail_InvalidBidAmount() public {
        vm.prank(seller);
        auction.createAuction{value: CREATION_FEE}(
            TOKEN_ID, 
            1 ether, 
            MIN_DURATION
        );
        
        vm.prank(bidder1);
        // Ar trebui sa fail
        auction.placeBid{value: 0.5 ether + BID_FEE}(TOKEN_ID);
    }

    function testFail_BidOnNonexistentAuction() public {
        vm.prank(bidder1);
        vm.expectRevert("Auction does not exist");

        // Ar trebui sa fail
        auction.placeBid{value: 1 ether + BID_FEE}(999);
    }

    function testFail_CreateAuctionTwice() public {
        vm.startPrank(seller);
        auction.createAuction{value: CREATION_FEE}(TOKEN_ID, 1 ether, 3 ether);
        vm.expectRevert("Auction already exists");
        auction.createAuction{value: CREATION_FEE}(TOKEN_ID, 1 ether, 3 ether); 
        vm.stopPrank();
    }

    function testFail_BidAfterEnd() public {
        // Create auction with minimum duration
        vm.startPrank(seller);
        auction.createAuction{value: CREATION_FEE}(
            TOKEN_ID, 
            1 ether,
            MIN_DURATION
        );
        vm.stopPrank();
        
        // Get auction start time
        InterfaceNFTAuction.Auction memory auctionData = auction.getAuction(TOKEN_ID);
        uint256 auctionEndTime = auctionData.startTime + MIN_DURATION;
        // Mutam la final timpul
        vm.warp(auctionEndTime + 1);
        vm.prank(bidder1);
        auction.placeBid{value: 1.5 ether + BID_FEE}(TOKEN_ID);
    }
}