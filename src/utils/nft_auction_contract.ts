import { ethers } from 'ethers';
import NFTAuctionContractABI from '../../artifacts/contracts/NFTAuction.sol/NFTAuction.json';

export interface Auction {
  seller: string;
  tokenId: bigint;
  startingPrice: bigint;
  reservePrice: bigint;
  duration: bigint;
  startTime: bigint;
  active: boolean;
  highestBidder: string;
  highestBid: bigint;
}

export interface NFTAuctionContract {
  creationFee(): Promise<bigint>;
  bidFee(): Promise<bigint>;
  finalizePercentage(): Promise<bigint>;
  minAuctionDuration(): Promise<bigint>;
  maxAuctionDuration(): Promise<bigint>;
  whitelistedCollections(collection: string): Promise<boolean>;

  createAuction(
    tokenId: ethers.BigNumberish, 
    startingPrice: ethers.BigNumberish, 
    reservePrice: ethers.BigNumberish, 
    duration: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  placeBid(
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  endAuction(
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  cancelAuction(
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  getAuction(
    tokenId: ethers.BigNumberish
  ): Promise<Auction>;

  getUserAuctions(
    user: string
  ): Promise<bigint[]>;

  getRunningAuctions(): Promise<Auction[]>;

  whitelistCollection(
    collection: string, 
    status: boolean
  ): Promise<ethers.ContractTransactionResponse>;
}

export function createNFTAuctionContract(address: string, provider: ethers.Provider | ethers.Signer): NFTAuctionContract {
  const contract = new ethers.Contract(address, NFTAuctionContractABI.abi, provider);

  return {
    creationFee: () => contract.creationFee(),
    bidFee: () => contract.bidFee(),
    finalizePercentage: () => contract.finalizePercentage(),
    minAuctionDuration: () => contract.minAuctionDuration(),
    maxAuctionDuration: () => contract.maxAuctionDuration(),
    whitelistedCollections: (collection) => contract.whitelistedCollections(collection),

    createAuction: (tokenId, startingPrice, reservePrice, duration) => 
      contract.createAuction(tokenId, startingPrice, reservePrice, duration),

    placeBid: (tokenId) => contract.placeBid(tokenId),

    endAuction: (tokenId) => contract.endAuction(tokenId),

    cancelAuction: (tokenId) => contract.cancelAuction(tokenId),

    getAuction: (tokenId) => contract.getAuction(tokenId),

    getUserAuctions: (user) => contract.getUserAuctions(user),

    getRunningAuctions: () => contract.getRunningAuctions(),

    whitelistCollection: (collection, status) => 
      contract.whitelistCollection(collection, status)
  };
}