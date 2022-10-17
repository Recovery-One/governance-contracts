import { ethers } from "hardhat";
const { upgrades } = require("hardhat");


async function main() {
    const proxy = "0x82B039D44fE582646170fe3aCD90822bCbB47aAE"
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS")
    //const exchangeContractImpl = await ExchangeUSDS.deploy();
    
    // console.log("deployed impl=", exchangeContractImpl.address)
    const exchangeContract = await upgrades.upgradeProxy(proxy, ExchangeUSDS)
    
    // set to correct USDS address
    await exchangeContract.setRefundToken("0x471f66F75af9238A2FA23bA23862B5957109fB21")
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  