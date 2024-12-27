import { ethers } from 'ethers';
import NFTRegistryABI from '../../artifacts/contracts/NFTRegistry.sol/NFTRegistry.json';

export interface NFTRegistryContract {
  registerNFT(
    collection: string,
    owner: string,
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  transferNFT(
    collection: string,
    from: string,
    to: string,
    tokenId: ethers.BigNumberish
  ): Promise<ethers.ContractTransactionResponse>;

  getUserNFTs(
    user: string
  ): Promise<ethers.BigNumberish[]>;

  getAllNFTs(): Promise<Array<ethers.BigNumberish>>;
  
  getNFTCollection(
    tokenId: ethers.BigNumberish
  ): Promise<string>;
}

export function createNFTRegistryContract(
  address: string,
  provider: ethers.Provider | ethers.Signer
): NFTRegistryContract {
  const contract = new ethers.Contract(address, NFTRegistryABI.abi, provider);

  return {
    registerNFT: (collection, owner, tokenId) => 
      contract.registerNFT(collection, owner, tokenId),
    transferNFT: (collection, from, to, tokenId) => 
      contract.transferNFT(collection, from, to, tokenId),
    getUserNFTs: async (user) => {
      const result = await contract.getUserNFTs(user);
      return Array.isArray(result) ? result : [];
    },
    getAllNFTs: async () => {
      const result = await contract.getAllNFTs();
      return Array.isArray(result) ? result : [];
    },
    getNFTCollection: (tokenId) => 
      contract.getNFTCollection(tokenId)
  };
}
