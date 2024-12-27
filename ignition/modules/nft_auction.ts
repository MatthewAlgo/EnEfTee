import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

if (!process.env.NEXT_PUBLIC_USER_RECORDS_ADDRESS) {
  throw new Error("USER_RECORDS_ADDRESS is not defined in environment variables");
}

const NFTAuctionModule = buildModule("NFTAuctionModule", (m) => {
  
  const nftAddress = m.getParameter(
    "nftAddress", 
    process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || ""
  );
  const userRecordsAddress = m.getParameter(
    "userRecordsAddress", 
    process.env.NEXT_PUBLIC_USER_RECORDS_ADDRESS || ""
  );

  const creationFee = ethers.parseEther("0.1").toString(); // 0.1 ETH
  const bidFee = ethers.parseEther("0.05").toString(); // 0.05 ETH
  const finalizePercentage = "250"; // 2.5%
  const minDuration = "30"; // 30 seconds
  const maxDuration = "604800"; // 1 week

  const nftAuction = m.contract("NFTAuction", [
    nftAddress,
    creationFee,
    bidFee,
    finalizePercentage,
    minDuration,
    maxDuration,
    userRecordsAddress
  ]);

  // Only whitelist collection if nftAddress is provided
  if (nftAddress) {
    m.call(nftAuction, "whitelistCollection", [nftAddress, true]);
  }

  return { nftAuction };
});

export default NFTAuctionModule;
