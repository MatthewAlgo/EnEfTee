import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

if (!process.env.NEXT_PUBLIC_NFT_REGISTRY_ADDRESS) {
    throw new Error("NFT_REGISTRY_ADDRESS is not defined in environment variables");
}

const NFT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_NFT_REGISTRY_ADDRESS;

export default buildModule("NFTModule", (m) => {

    const nft = m.contract("NFT", [
        "MyNFT", // Nume           
        "MNFT",// Simbol 
        NFT_REGISTRY_ADDRESS
    ]);

    return { nft };
});
