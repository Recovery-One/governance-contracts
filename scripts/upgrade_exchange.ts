import { ethers } from "hardhat";
const { upgrades } = require("hardhat");


async function main() {
    const proxy = "0x82B039D44fE582646170fe3aCD90822bCbB47aAE"
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS")
    const exchangeContractImpl = await ExchangeUSDS.deploy();
    const exchangeContract = await upgrades.upgradeProxy(proxy, exchangeContractImpl)
    // await exchangeContract.setRefundToken()
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  