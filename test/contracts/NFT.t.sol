// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../contracts/NFT.sol";
import "../../contracts/NFTRegistry.sol";
import "../../contracts/UserRecords.sol";

contract NFTTest is Test {
    NFT public nft;
    NFTRegistry public registry;
    UserRecords public userRecords;
    
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        // Incarc contractele
        registry = new NFTRegistry();
        userRecords = new UserRecords();
        nft = new NFT("TestNFT", "TNFT", address(registry), address(userRecords));
        // Roluri, permisiuni
        registry.transferOwnership(address(nft));
        // Incarcam conturile cu ETH
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }
    
    function testMinting() public {
        uint256 tokenId = 1;
        string memory tokenURI = "ipfs://test";
        
        vm.startPrank(user1);
        nft.mintWithMetadata(user1, tokenId, tokenURI);
        vm.stopPrank();
        
        assertEq(nft.ownerOf(tokenId), user1);
        assertEq(nft.tokenURI(tokenId), tokenURI);
    }
    
    function testFailMintingDuplicate() public {
        uint256 tokenId = 1;
        string memory tokenURI = "ipfs://test";
        
        vm.startPrank(user1);
        nft.mintWithMetadata(user1, tokenId, tokenURI);
        // Ar trebui sa fail
        nft.mintWithMetadata(user1, tokenId, tokenURI); 
        vm.stopPrank();
    }
    
    function testTransfer() public {
        uint256 tokenId = 1;
        string memory tokenURI = "ipfs://test";
        
        vm.prank(user1);
        nft.mintWithMetadata(user1, tokenId, tokenURI);
        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
    }
    
    function testFailUnauthorizedTransfer() public {
        uint256 tokenId = 1;
        string memory tokenURI = "ipfs://test";
        vm.prank(user1);
        nft.mintWithMetadata(user1, tokenId, tokenURI);
        
        vm.prank(user2);
        nft.transferFrom(user1, user2, tokenId);
    }
    
    function testApproval() public {
        uint256 tokenId = 1;
        string memory tokenURI = "ipfs://test";
        vm.prank(user1);
        nft.mintWithMetadata(user1, tokenId, tokenURI);
        
        vm.prank(user1);
        nft.approve(user2, tokenId);
        vm.prank(user2);
        nft.transferFrom(user1, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
    }
    
    function testValidations() public {
        vm.startPrank(user1);
        
        vm.expectRevert("Invalid mint parameters");
        nft.mintWithMetadata(user1, 0, "ipfs://test");
        
        vm.expectRevert("Invalid mint parameters");
        nft.mintWithMetadata(user1, 1, "");
        
        vm.expectRevert("Invalid mint parameters");
        nft.mintWithMetadata(address(0), 1, "ipfs://test");
        
        vm.stopPrank();
    }
}
