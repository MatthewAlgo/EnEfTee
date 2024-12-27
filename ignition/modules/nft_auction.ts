import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const NFTAuctionModule = buildModule("NFTAuctionModule", (m) => {
  const nftAddress = m.getParameter("nftAddress", process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS);

  const nftAuction = m.contract("NFTAuction", [
    nftAddress,                // NFT contract address
    "100000000000000000",      // Creation fee (0.1 ETH)
    "50000000000000000",       // Bid fee (0.05 ETH)
    "250",                     // Finalize percentage (2.5%)
    "3600",                    // Min duration (1 hour)
    "604800"                   // Max duration (1 week)
  ]);

  m.call(nftAuction, "whitelistCollection", [nftAddress, true]);

  return { nftAuction };
});

export default NFTAuctionModule;
