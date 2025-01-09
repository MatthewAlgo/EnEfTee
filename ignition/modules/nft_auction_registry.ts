import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NFTAuctionRegistryModule = buildModule("NFTAuctionRegistryModule", (m) => {
  const registry = m.contract("NFTAuctionRegistry", []);
  
  return { registry };
});

export default NFTAuctionRegistryModule;
