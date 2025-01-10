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

// Add utility function for filtering expired auctions
export function filterExpiredAuctions(auctions: Auction[], userAddress: string): Auction[] {
  const currentTime = Math.floor(Date.now() / 1000);
  return auctions.filter(auction => 
    auction.active && 
    auction.seller.toLowerCase() === userAddress.toLowerCase() &&
    Number(auction.startTime) + Number(auction.duration) <= currentTime
  );
}

export interface NFTAuctionContract {
  creationFee(): Promise<bigint>;
  bidFee(): Promise<bigint>;
  finalizePercentage(): Promise<bigint>;
  minBidIncrement(): Promise<bigint>;
  minAuctionDuration(): Promise<bigint>;
  maxAuctionDuration(): Promise<bigint>;
  
  createAuction(
    tokenId: ethers.BigNumberish,
    startingPrice: ethers.BigNumberish,
    reservePrice: ethers.BigNumberish,
    duration: ethers.BigNumberish,
    overrides?: ethers.Overrides & { value?: ethers.BigNumberish }
  ): Promise<ethers.ContractTransactionResponse>;
  
  placeBid(
    tokenId: ethers.BigNumberish,
    overrides?: ethers.Overrides & { value?: ethers.BigNumberish }
  ): Promise<ethers.ContractTransactionResponse>;
  
  endAuction(
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;
  
  getAuction(
    tokenId: ethers.BigNumberish
  ): Promise<Auction>;
  
  getUserAuctions(
    user: string
  ): Promise<Auction[]>;
  
  getAllActiveAuctions(): Promise<Auction[]>;
  
  updateCreationFee(
    newFee: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;
  
  updateBidFee(
    newFee: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;
  
  updateFinalizePercentage(
    newPercentage: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;
  
  updateMinBidIncrement(
    newIncrement: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  emergencyWithdraw(
    recipient: string,
    amount: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  emergencyWithdrawNFT(
    tokenId: ethers.BigNumberish,
    recipient: string
  ): Promise<ethers.ContractTransactionResponse>;

  cancelAuction(
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  finalizeExpiredAuction(
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  whitelistCollection(
    collection: string,
    status: boolean
  ): Promise<ethers.ContractTransactionResponse>;

  updateAuctionParameters(
    tokenId: ethers.BigNumberish,
    newReservePrice: ethers.BigNumberish,
    newDuration: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  getUserExpiredAuctions(
    user: string
  ): Promise<Auction[]>;
}

export function createNFTAuctionContract(
  address: string,
  provider: ethers.Provider | ethers.Signer
): NFTAuctionContract {
  const contract = new ethers.Contract(
    address,
    NFTAuctionContractABI.abi,
    provider
  );
  
  return {
    creationFee: () => contract.creationFee(),
    bidFee: () => contract.bidFee(),
    finalizePercentage: () => contract.finalizePercentage(),
    minBidIncrement: () => contract.minBidIncrement(),
    minAuctionDuration: () => contract.minAuctionDuration(),
    maxAuctionDuration: () => contract.maxAuctionDuration(),
    
    createAuction: (tokenId, startingPrice, reservePrice, duration, overrides) =>
      contract.createAuction(tokenId, startingPrice, reservePrice, duration, overrides),
    
    placeBid: (tokenId, overrides) => 
      contract.placeBid(tokenId, overrides),
    
    endAuction: (tokenId) => 
      contract.endAuction(tokenId),
    
    getAuction: (tokenId) => 
      contract.getAuction(tokenId),
    
    getUserAuctions: (user) => 
      contract.getUserAuctions(user),
    
    getAllActiveAuctions: () => 
      contract.getAllActiveAuctions(),
    
    updateCreationFee: (newFee) => 
      contract.updateCreationFee(newFee),
    
    updateBidFee: (newFee) => 
      contract.updateBidFee(newFee),
    
    updateFinalizePercentage: (newPercentage) => 
      contract.updateFinalizePercentage(newPercentage),
    
    updateMinBidIncrement: (newIncrement) => 
      contract.updateMinBidIncrement(newIncrement),
    
    emergencyWithdraw: (recipient, amount) => 
      contract.emergencyWithdraw(recipient, amount),
    
    emergencyWithdrawNFT: (tokenId, recipient) => 
      contract.emergencyWithdrawNFT(tokenId, recipient),
    
    cancelAuction: (tokenId) => 
      contract.cancelAuction(tokenId),
    
    finalizeExpiredAuction: (tokenId) => 
      contract.finalizeExpiredAuction(tokenId),
    
    whitelistCollection: (collection, status) => 
      contract.whitelistCollection(collection, status),
    
    updateAuctionParameters: (tokenId, newReservePrice, newDuration) =>
      contract.updateAuctionParameters(tokenId, newReservePrice, newDuration),
    
    getUserExpiredAuctions: async (user: string) => {
      try {
        const result = await contract.getUserAuctions(user);
        return filterExpiredAuctions(result, user);
      } catch (error) {
        console.error('Error getting expired auctions:', error);
        return [];
      }
    }
  };
}