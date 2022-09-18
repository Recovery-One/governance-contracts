import { ethers } from "hardhat";

var depegged  = [["1USDC","0x985458E523dB3d53125813eD68c274899e9DfAb4","384172000000000000"],
                ["1ETH","0x6983D1E6DEf3690C4d616b13597A09e6193EA013",422589320],
                ["1WBTC","0x3095c7557bCb296ccc6e363DE01b760bA031F2d9","76834421820000000000"],
                ["1USDT","0x3C2B8Be99c50593081EAA2A724F0B8285F5aba8f","384172000000000000"],
                ["1DAI","0xEf977d2f931C1978Db5F6747666fa1eACB0d0339",384172],
                ["1FRAX","0xeB6C08ccB4421b6088e581ce04fcFBed15893aC3",384172],
                ["1BUSD","0xE176EBE47d621b984a73036B9DA5d834411ef734",384172],
                ["bscBNB","0xb1f6E61E1e113625593a22fa6aa94F8052bc39E0",84517864],
                ["bscBUSD","0x0aB43550A6915F9f67d0c454C2E90385E6497EaA",384172],
                ["1FXS","0x775d7816afbEf935ea9c21a3aC9972F269A39004",2043795],
                ["1SUSHI","0xBEC775Cb42AbFa4288dE81F387a9b1A3c4Bc552A",434114],
                ["1AAG","0xAE0609A062a4eAED49dE28C5f6A193261E0150eA",3841],
                ["1AAVE","0xcF323Aad9E522B93F11c352CaA519Ad0E14eB40F",23818670],
                ["1WETH","0xF720b7910C6b2FF5bd167171aDa211E226740bfe",422589320]]

async function main() {
  const committeeAccount = "0xE9C35df9244B2cE49666eFF0FE2E537e3ECf6FB7";
  const tokens = depegged.map(e =>e[1].toString());
  const ratios = depegged.map(e=>e[2]);
  const RecoveryToken = await ethers.getContractFactory("RecoveryOneToken");
  const recoveryToken = await RecoveryToken.deploy(tokens, ratios);

  const Governance = await ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(recoveryToken.address, committeeAccount, {gasLimit: 30000000});

  console.log("RecoveryOne: ", recoveryToken.address);
  console.log("Governance:", governance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
