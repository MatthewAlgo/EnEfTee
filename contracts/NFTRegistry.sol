// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/Ownable.sol";
import "./interfaces/InterfaceERC721.sol";

contract NFTRegistry is Ownable {
    mapping(address => uint256[]) private _userNFTs;
    mapping(address => mapping(uint256 => bool)) private _nftCollections;
    event NFTRegistered(address indexed collection, address indexed owner, uint256 tokenId);
    event NFTTransferred(address indexed collection, address indexed from, address indexed to, uint256 tokenId);
    
    function registerNFT(address collection, address owner, uint256 tokenId) external {
        require(msg.sender == collection, "Only NFT contract can register");
        _userNFTs[owner].push(tokenId);
        _nftCollections[collection][tokenId] = true;
        emit NFTRegistered(collection, owner, tokenId);
    }
    
    function transferNFT(address collection, address from, address to, uint256 tokenId) external {
        require(msg.sender == collection, "Only NFT contract can transfer");
        _removeNFTFromOwner(from, tokenId);
        _userNFTs[to].push(tokenId);
        emit NFTTransferred(collection, from, to, tokenId);
    }
    
    function getUserNFTs(address user) external view returns (uint256[] memory) {
        return _userNFTs[user];
    }
    
    function _removeNFTFromOwner(address owner, uint256 tokenId) private {
        uint256[] storage userTokens = _userNFTs[owner];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (userTokens[i] == tokenId) {
                userTokens[i] = userTokens[userTokens.length - 1];
                userTokens.pop();
                break;
            }
        }
    }
}
