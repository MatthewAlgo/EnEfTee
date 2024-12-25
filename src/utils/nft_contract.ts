import { ethers } from 'ethers';
import NFTContractABI from '../../artifacts/contracts/NFT.sol/NFT.json';

export interface NFTContract {
  name(): Promise<string>;
  symbol(): Promise<string>;
  tokenURI(tokenId: ethers.BigNumberish): Promise<string>;
  balanceOf(owner: string): Promise<bigint>;
  ownerOf(tokenId: ethers.BigNumberish): Promise<string>;
  approve(to: string, tokenId: ethers.BigNumberish): Promise<ethers.ContractTransactionResponse>;
  getApproved(tokenId: ethers.BigNumberish): Promise<string>;
  setApprovalForAll(operator: string, approved: boolean): Promise<ethers.ContractTransactionResponse>;
  isApprovedForAll(owner: string, operator: string): Promise<boolean>;
  transferFrom(from: string, to: string, tokenId: ethers.BigNumberish): Promise<ethers.ContractTransactionResponse>;
  mint(to: string, tokenId: ethers.BigNumberish): Promise<ethers.ContractTransactionResponse>;
  mintWithMetadata(to: string, tokenId: ethers.BigNumberish, tokenURI: string): Promise<ethers.ContractTransactionResponse>;
}

export function createNFTContract(address: string, provider: ethers.Provider | ethers.Signer): NFTContract {
  const contract = new ethers.Contract(address, NFTContractABI.abi, provider);

  return {
    name: () => contract.name(),
    symbol: () => contract.symbol(),
    tokenURI: (tokenId) => contract.tokenURI(tokenId),
    balanceOf: (owner) => contract.balanceOf(owner),
    ownerOf: (tokenId) => contract.ownerOf(tokenId),
    approve: (to, tokenId) => contract.approve(to, tokenId),
    getApproved: (tokenId) => contract.getApproved(tokenId),
    setApprovalForAll: (operator, approved) => contract.setApprovalForAll(operator, approved),
    isApprovedForAll: (owner, operator) => contract.isApprovedForAll(owner, operator),
    transferFrom: (from, to, tokenId) => contract.transferFrom(from, to, tokenId),
    mint: (to, tokenId) => contract.mint(to, tokenId),
    mintWithMetadata: (to, tokenId, tokenURI) => contract.mintWithMetadata(to, tokenId, tokenURI)
  };
}