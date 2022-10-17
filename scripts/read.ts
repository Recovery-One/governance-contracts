import { ethers } from "hardhat";

async function main() {
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS"); 
    const exchangeContract = ExchangeUSDS.attach("0x82B039D44fE582646170fe3aCD90822bCbB47aAE");
    // exchangeContract.setRateForNonR1("700");
    // exchangeContract.setRateForR1("1000");
    console.log("PROXY=", exchangeContract.address)
    console.log("pegRONE", await exchangeContract.pegRateRONE())
    console.log("pegNonRONE", await exchangeContract.pegRateNonRONE())
    console.log("refundMax",await exchangeContract.refundMaxPerAddress())    
    console.log("refundToken", await exchangeContract.refundToken())    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  