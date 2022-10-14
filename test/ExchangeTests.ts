import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "../typechain-types/@openzeppelin/contracts";

describe("RecoveryToken", function () {
    const DIVISOR = 10000;
    const DECIMALS = 1000000;
    // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function simpleFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const ERCMock = await ethers.getContractFactory("ERCMock");
    const refundToken = await ERCMock.deploy("erc0", "USDS");
    const erc1 = await ERCMock.deploy("erc1", "UDSC");
    await erc1.transfer(otherAccount.address, 100*DECIMALS)
    
    const voterAddresses = [owner.address];
    const votes = [1];
    const tokens = [erc1.address];
    const ratios = ["384172000000000000"];
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS");
    const exchangeContract = await ExchangeUSDS.deploy(voterAddresses, votes, tokens, ratios, refundToken.address, ethers.utils.parseEther("100"));
    const tokenContracts = [erc1];
    await refundToken.transfer(exchangeContract.address, 1000*DECIMALS);
    await exchangeContract.setRateForR1(1500); // 15%
    await exchangeContract.setRateForNonR1(1000); // 15%
    await exchangeContract.setTokenSupport(erc1.address, true);
    return { exchangeContract, refundToken, tokenContracts, ratios, owner, otherAccount };
  }
  
    it("Stake & burn", async function () {
        const { exchangeContract, refundToken, tokenContracts, ratios, owner, otherAccount } = await loadFixture(simpleFixture);
        console.log("Exchange USDS", await refundToken.balanceOf(exchangeContract.address));
        console.log("Owner balance USDC", await tokenContracts[0].balanceOf(owner.address));

        const tokenToBurn = ethers.utils.parseUnits("100", 6);
        const prehackedValue = await exchangeContract.calculatePrehackOnePrice(tokenContracts[0].address, tokenToBurn);
        expect(prehackedValue).to.equal(ethers.BigNumber.from(tokenToBurn).mul(ratios[0]).div(DIVISOR));
        console.log("prehacked $100 => ", prehackedValue, ethers.utils.formatEther(prehackedValue))

        // TEST FOR R1Voter
        var isR1Voter = await exchangeContract.isR1Voter(owner.address);
        console.log("isVoter", isR1Voter);
        expect(isR1Voter).to.equal("1");
        var [USDSReturn, voter] = await exchangeContract.getExchangeRate(owner.address, tokenContracts[0].address, tokenToBurn);
        expect(USDSReturn).to.equal(prehackedValue.mul(1500).div(DIVISOR).div(10**12))
        console.log("Expected USDS=", USDSReturn, voter, ethers.utils.formatUnits(USDSReturn, 6));
        expect(voter).to.equal(true);

        await tokenContracts[0].approve(exchangeContract.address, tokenToBurn)
        console.log("allow?", await tokenContracts[0].allowance(owner.address, exchangeContract.address))
        console.log("to burn", tokenToBurn);
        
        await expect(exchangeContract.burn(tokenContracts[0].address, tokenToBurn))
            .to.emit(exchangeContract, "BurnToken")
            .withArgs(tokenContracts[0].address, tokenToBurn, refundToken.address, USDSReturn)
            .changeTokenBalances(
                tokenContracts[0],
                [owner.address, exchangeContract],
                [tokenToBurn.mul(-1), 0]
              )
              .changeTokenBalances(
                refundToken,
                [exchangeContract, owner.address],
                [USDSReturn.mul(-1), USDSReturn]
              )              
        // TEST FOR NON VOTER
        {
            var isR1Voter = await exchangeContract.isR1Voter(otherAccount.address);
            expect(isR1Voter).to.equal("0");
            var [USDSReturn, voter] = await exchangeContract.getExchangeRate(otherAccount.address, tokenContracts[0].address, tokenToBurn);
            expect(USDSReturn).to.equal(prehackedValue.mul(1000).div(DIVISOR).div(10**12))
            console.log("USDS=", USDSReturn, voter, ethers.utils.formatUnits(USDSReturn, 6));
            expect(voter).to.equal(false);
            
            await tokenContracts[0].connect(otherAccount).approve(exchangeContract.address, tokenToBurn)            
            await expect(exchangeContract.connect(otherAccount).burn(tokenContracts[0].address, tokenToBurn))
            .to.emit(exchangeContract, "BurnToken")
            .withArgs(tokenContracts[0].address, tokenToBurn, refundToken.address, USDSReturn)
            .changeTokenBalances(
                tokenContracts[0],
                [otherAccount.address, exchangeContract],
                [tokenToBurn.mul(-1), '0']
              )
              .changeTokenBalances(
                refundToken,
                [exchangeContract, otherAccount.address],
                [USDSReturn.mul(-1), USDSReturn]
              )   
        }
    });
  
  
})
