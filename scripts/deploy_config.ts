import { ethers } from "hardhat";

async function main() {
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS"); 
    const exchangeContract = ExchangeUSDS.attach("0xA33CCE4fED55FD87DA2b60b74823B1FCcFB024E2");
    await exchangeContract.setRateForR1(2000, {gasLimit: 200000});
    await exchangeContract.setRateForNonR1(1000, {gasLimit: 200000});    
    await exchangeContract.setRefundMaximumPerWallet(ethers.utils.parseUnits("1000", 6), {gasLimit: 200000});    
    await exchangeContract.setTokenSupport("0x985458E523dB3d53125813eD68c274899e9DfAb4", true, {gasLimit: 200000});
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  