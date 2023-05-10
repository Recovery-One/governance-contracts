import { ethers } from "hardhat";
const USDC = "0xBC594CABd205bD993e7FfA6F3e9ceA75c1110da5"
var depegged  = [["1USDC","0x985458E523dB3d53125813eD68c274899e9DfAb4","10000"],
                ["1ETH","0x6983D1E6DEf3690C4d616b13597A09e6193EA013",11000000],
                ["1WBTC","0x3095c7557bCb296ccc6e363DE01b760bA031F2d9","200000000"],
                ["1USDT","0x3C2B8Be99c50593081EAA2A724F0B8285F5aba8f","10000"],
                ["1DAI","0xEf977d2f931C1978Db5F6747666fa1eACB0d0339",10000],
                ["1FRAX","0xeB6C08ccB4421b6088e581ce04fcFBed15893aC3",10000],
                ["1BUSD","0xE176EBE47d621b984a73036B9DA5d834411ef734",10000],
                ["bscBNB","0xb1f6E61E1e113625593a22fa6aa94F8052bc39E0",2200000],
                ["bscBUSD","0x0aB43550A6915F9f67d0c454C2E90385E6497EaA",10000],
                ["1FXS","0x775d7816afbEf935ea9c21a3aC9972F269A39004",53200],
                ["1SUSHI","0xBEC775Cb42AbFa4288dE81F387a9b1A3c4Bc552A",100],
                ["1AAG","0xAE0609A062a4eAED49dE28C5f6A193261E0150eA",620000],
                ["1AAVE","0xcF323Aad9E522B93F11c352CaA519Ad0E14eB40F",11000000],
                ["1WETH","0xF720b7910C6b2FF5bd167171aDa211E226740bfe",200]]

                
async function main() {
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS"); 
    const exchangeContract = ExchangeUSDS.attach("0x56ff8BE962d531f5f1a5bDed45c6B61e11D18fC6");
    // await exchangeContract.setRateForNonR1("700");
    // await exchangeContract.setRateForR1("1000");
    //await exchangeContract.setRefundMaximumPerWallet(ethers.utils.parseUnits("1000", 6), {gasLimit: 200000});    
    // await exchangeContract.transferOwnership("0x5deE295186FeB7c641459D16ff5BC22156A387a4")
    // await exchangeContract.setRefundToken(USDC);
    
    console.log("PROXY=", exchangeContract.address)
    console.log("pegRONE", await exchangeContract.pegRateRONE())
    console.log("pegNonRONE", await exchangeContract.pegRateNonRONE())
    console.log("refundMax",await exchangeContract.refundMaxPerAddress())    
    console.log("refundToken", await exchangeContract.refundToken())    
    console.log("==== REPORT REFUNDBYTOKEN ==== ")
    for (var coin of depegged) {
        console.log(coin[0], coin[1], await (await exchangeContract.refundByToken(coin[1] as string)).toString())
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  