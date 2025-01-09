import { ethers } from 'ethers';
import NFTAuctionRegistryABI from '../../artifacts/contracts/NFTAuctionRegistry.sol/NFTAuctionRegistry.json';
import { Auction } from './nft_auction_contract';

export interface NFTAuctionRegistryContract {
  whitelistedCollections(collection: string): Promise<boolean>;
  isCollectionWhitelisted(collection: string): Promise<boolean>;
  getAuction(tokenId: ethers.BigNumberish): Promise<Auction>;
  getUserAuctions(user: string): Promise<Auction[]>;
  getAllActiveAuctions(): Promise<Auction[]>;
  whitelistCollection(
    collection: string,
    status: boolean
  ): Promise<ethers.ContractTransactionResponse>;
  updateAuctionParameters(
    tokenId: ethers.BigNumberish,
    newReservePrice: ethers.BigNumberish,
    newDuration: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;
}

export function createNFTAuctionRegistryContract(
  address: string,
  provider: ethers.Provider | ethers.Signer
): NFTAuctionRegistryContract {
  const contract = new ethers.Contract(
    address,
    NFTAuctionRegistryABI.abi,
    provider
  );

  return {
    whitelistedCollections: (collection) => 
      contract.whitelistedCollections(collection),
    isCollectionWhitelisted: (collection) => 
      contract.isCollectionWhitelisted(collection),
    getAuction: (tokenId) => 
      contract.getAuction(tokenId),
    getUserAuctions: (user) => 
      contract.getUserAuctions(user),
    getAllActiveAuctions: () => 
      contract.getAllActiveAuctions(),
    whitelistCollection: (collection, status) => 
      contract.whitelistCollection(collection, status),
    updateAuctionParameters: (tokenId, newReservePrice, newDuration) =>
      contract.updateAuctionParameters(tokenId, newReservePrice, newDuration)
  };
}
