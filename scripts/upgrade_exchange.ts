import { ethers } from "hardhat";
const { upgrades } = require("hardhat");


async function main() {
    const proxy = "0x56ff8be962d531f5f1a5bded45c6b61e11d18fc6"
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS")
    // const exchangeContractImpl = ExchangeUSDS.attach("0x90CCd6e759bB083419a218C30F171092E19166ec")    
    // console.log("deployed impl=", exchangeContractImpl.address)

    const exchangeContract = await upgrades.upgradeProxy(proxy, ExchangeUSDS)
    console.log("upgrade completed")
    // const exchangeContract = ExchangeUSDS.attach(proxy)
    // await exchangeContract.transferOwnership('0x74360B35915D2261Ef5080fEcD60CD0188eA4B51');

    // set to correct USDS address
    // await exchangeContract.setRefundToken("0x471f66F75af9238A2FA23bA23862B5957109fB21")
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  