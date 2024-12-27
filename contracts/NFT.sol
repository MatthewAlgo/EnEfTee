// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/InterfaceERC721.sol";
import "./interfaces/Ownable.sol";
import "./NFTRegistry.sol";
import "./UserRecords.sol";

contract NFT is InterfaceERC721, Ownable {
    string private _name;
    string private _symbol;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;

    NFTRegistry private _registry;
    UserRecords private _userRecords;

    event TokenURISet(uint256 indexed tokenId, string uri);

    constructor(
        string memory name_, 
        string memory symbol_, 
        address registryAddress,
        address userRecordsAddress
    ) {
        _name = name_;
        _symbol = symbol_;
        _registry = NFTRegistry(registryAddress);
        _userRecords = UserRecords(userRecordsAddress);
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        string memory uri = _tokenURIs[tokenId];
        require(bytes(uri).length > 0, "URI not set");
        return uri;
    }

    function balanceOf(address owner) external view override returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view override returns (address) {
        return _owners[tokenId];
    }

    function approve(address to, uint256 tokenId) external override {
        address owner = _owners[tokenId];
        require(msg.sender == owner || _operatorApprovals[owner][msg.sender], "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view override returns (address) {
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) external view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(_owners[tokenId] == address(0), "Token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;

        _userRecords.recordTransaction(to, UserRecords.TransactionType.MINT, tokenId, 0, address(0), to, true);

        emit Transfer(address(0), to, tokenId);
    }

    function mintWithMetadata(address to, uint256 tokenId, string memory tokenURI_) external {
        require(to != address(0), "Invalid address");
        require(_owners[tokenId] == address(0), "Token already minted");
        require(bytes(tokenURI_).length > 0, "URI cannot be empty");

        _balances[to] += 1;
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = tokenURI_;

        _userRecords.recordTransaction(to, UserRecords.TransactionType.MINT, tokenId, 0, address(0), to, true);

        emit TokenURISet(tokenId, tokenURI_);
        emit Transfer(address(0), to, tokenId);
        _registry.registerNFT(address(this), to, tokenId);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(_owners[tokenId] == from, "Not token owner");
        require(to != address(0), "Invalid address");

        _approve(address(0), tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        _userRecords.recordTransaction(from, UserRecords.TransactionType.TRANSFER, tokenId, 0, from, to, true);

        emit Transfer(from, to, tokenId);
        _registry.transferNFT(address(this), from, to, tokenId);
    }

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(_owners[tokenId], to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
        address owner = _owners[tokenId];
        return (spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender]);
    }

    function getAllTokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _registry.getUserNFTs(owner);
    }
}
