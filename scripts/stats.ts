import { ethers } from "hardhat";

async function main() {
    const RecoveryToken = await ethers.getContractFactory("RecoveryOneToken");
    const contract = RecoveryToken.attach("0x9De4d1267a1075E994ddc8d6bC31b9056B9b4133");
    console.log("Total supply:", ethers.utils.formatEther(await contract.totalSupply()), "rONE");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  