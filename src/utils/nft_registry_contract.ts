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
    getUserNFTs: (user) => 
      contract.getUserNFTs(user)
  };
}
