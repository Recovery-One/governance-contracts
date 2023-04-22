import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils } from "../typechain-types/@openzeppelin/contracts";
import { BigNumber } from "ethers";

describe("RecoveryToken", function () {
    const DIVISOR = 10000;
    const DECIMALS = 1000000;
    const oneDollarUSDS = 10**6;

    // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function simpleFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const ERCMock = await ethers.getContractFactory("ERCMock");
    const refundToken = await ERCMock.deploy("erc0", "USDS", 6);
    const erc1 = await ERCMock.deploy("erc1", "UDSC", 6);
    await erc1.transfer(otherAccount.address, 100*DECIMALS)

    const btc1 = await ERCMock.deploy("btc", "BTC", 8);
    await btc1.transfer(otherAccount.address, 100*DECIMALS)

    const eth1 = await ERCMock.deploy("eth", "ETH", 18);
    await eth1.transfer(otherAccount.address, 100*18)

    const token3 = await ERCMock.deploy("eth", "ETH", 3);
    await token3.transfer(otherAccount.address, 100*3)
    
    const voterAddresses = [owner.address];
    const votes = [1];
    const tokens = [erc1.address, btc1.address, eth1.address, token3.address];
    const ratios = [10000, "200000000", "11000000", 10000];
    const ExchangeUSDS = await ethers.getContractFactory("ExchangeUSDS");
    const exchangeContract = await ExchangeUSDS.deploy();
    await exchangeContract.initialize(voterAddresses, votes, tokens, ratios, refundToken.address, ethers.utils.parseEther("100"));
    const tokenContracts = [erc1, btc1, eth1, token3];
    await refundToken.transfer(exchangeContract.address, 1000*DECIMALS);
    await exchangeContract.setRateForR1(1500); // 15%
    await exchangeContract.setRateForNonR1(1000); // 15%
    await exchangeContract.setTokenSupport(erc1.address, true);
    return { exchangeContract, refundToken, tokenContracts, ratios, owner, otherAccount };
  }
  
    it("Test BTC decimals", async function() {
      const { exchangeContract, refundToken, tokenContracts, ratios, owner, otherAccount } = await loadFixture(simpleFixture);      

      var tokenToBurn = ethers.utils.parseUnits("1", 6); // 1:1
      var [USDSReturn, voter] = await exchangeContract.getExchangeRate(otherAccount.address, tokenContracts[0].address, tokenToBurn);
      console.log("burn 1USDC", tokenToBurn.div(Math.pow(10, 6)).toString(), " and get $", USDSReturn.toNumber()/oneDollarUSDS)      

      // we expect to get back 10% of 20K => $2000 USDS   $2000.0000
      var tokenToBurn = ethers.utils.parseUnits("1", 8); // 1 BTC ~ 20K --- 8 decimals => 4 decimals      
      var [USDSReturn, voter] = await exchangeContract.getExchangeRate(otherAccount.address, tokenContracts[1].address, tokenToBurn);
      console.log("burn BTC", tokenToBurn.div(Math.pow(10, 8)).toString(), " and get $", USDSReturn.div(oneDollarUSDS).toString())      

      // we expect to get back 10% of 1100 => 110 USDS   
      var tokenToBurn = ethers.utils.parseUnits("1", 18); // 1 BTC ~ 20K --- 8 decimals => 4 decimals
      var [USDSReturn, voter] = await exchangeContract.getExchangeRate(otherAccount.address, tokenContracts[2].address, tokenToBurn);
      console.log("burn ETH", ethers.utils.formatEther(tokenToBurn), " and get $", USDSReturn.div(oneDollarUSDS).toString())      

      var tokenToBurn = ethers.utils.parseUnits("1", 3); // 1 BTC ~ 20K --- 8 decimals => 4 decimals
      var [USDSReturn, voter] = await exchangeContract.getExchangeRate(otherAccount.address, tokenContracts[3].address, tokenToBurn);
      console.log("burn 3-decimal Token", tokenToBurn.div(Math.pow(10, 3)).toString(), " and get $", USDSReturn.toNumber()/oneDollarUSDS)            
      
    })
    
    it("Stake & burn", async function () {
        const { exchangeContract, refundToken, tokenContracts, ratios, owner, otherAccount } = await loadFixture(simpleFixture);
        console.log("Exchange USDS", await refundToken.balanceOf(exchangeContract.address));
        console.log("Owner balance USDC", await tokenContracts[0].balanceOf(owner.address));

        const tokenToBurn = ethers.utils.parseUnits("100", 6);
        const prehackedValue = await exchangeContract.calculatePrehackOnePrice(tokenContracts[0].address, tokenToBurn);
        expect(prehackedValue).to.equal(ethers.BigNumber.from(tokenToBurn).mul(ratios[0]).div(DIVISOR));
        console.log("prehacked $100 => ", prehackedValue, ethers.utils.formatUnits(prehackedValue, 6))

        // TEST FOR R1Voter
        var isR1Voter = await exchangeContract.isR1Voter(owner.address);
        console.log("isVoter", isR1Voter);
        expect(isR1Voter).to.equal("1");
        var [USDSReturn, voter] = await exchangeContract.getExchangeRate(owner.address, tokenContracts[0].address, tokenToBurn);
        expect(USDSReturn).to.equal(prehackedValue.mul(1500).div(DIVISOR))
        console.log("Expected USDS=", USDSReturn, voter, ethers.utils.formatUnits(USDSReturn, 6));
        expect(voter).to.equal(true);

        await tokenContracts[0].approve(exchangeContract.address, tokenToBurn)
        
        console.log("allow?", await tokenContracts[0].allowance(owner.address, exchangeContract.address))
        console.log("to burn", tokenToBurn);
        var refundState = await exchangeContract.refundByUser(owner.address);
        console.log("refund state 1", refundState)
        
        var prehash = ethers.utils.defaultAbiCoder.encode(["bytes32", "address", "uint256", "address", "address", "uint256"], 
                                                        [ethers.utils.id("harmony+recovery>1"), 
                                                        owner.address,
                                                        refundState,
                                                        exchangeContract.address,
                                                        tokenContracts[0].address, 
                                                        tokenToBurn]);
        var hash = ethers.utils.keccak256(prehash);
        console.log("Secret hash0=", prehash, hash);                                                       
        
        await expect(exchangeContract.burn(tokenContracts[0].address, tokenToBurn, hash))
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
              
        // expect to fail!
        await expect(exchangeContract.burn(tokenContracts[0].address, tokenToBurn, hash)).to.be.revertedWith("wrong expected hash, bot?")
        
        
        // should update based on new state
        var refundState = await exchangeContract.refundByUser(owner.address);
        console.log("refund state 2", refundState)

        var prehash = ethers.utils.defaultAbiCoder.encode(["bytes32", "address", "uint256", "address", "address", "uint256"], 
                                                        [ethers.utils.id("harmony+recovery>1"), 
                                                        owner.address,
                                                        refundState,
                                                        exchangeContract.address,
                                                        tokenContracts[0].address, 
                                                        tokenToBurn]);
        var hash = ethers.utils.keccak256(prehash);
        console.log("Secret hash0b=", prehash, hash);                                                       
        
        await expect(exchangeContract.burn(tokenContracts[0].address, tokenToBurn, hash))
                      
        // TEST FOR NON VOTER
        {
            var isR1Voter = await exchangeContract.isR1Voter(otherAccount.address);
            expect(isR1Voter).to.equal("0");
            var [USDSReturn, voter] = await exchangeContract.getExchangeRate(otherAccount.address, tokenContracts[0].address, tokenToBurn);
            expect(USDSReturn).to.equal(prehackedValue.mul(1000).div(DIVISOR))
            console.log("USDS=", USDSReturn, voter, ethers.utils.formatUnits(USDSReturn, 6));
            expect(voter).to.equal(false);
            
            await tokenContracts[0].connect(otherAccount).approve(exchangeContract.address, tokenToBurn)            

            var prehash = ethers.utils.defaultAbiCoder.encode(["bytes32", "address","uint256",  "address", "address", "uint256"], 
                                                                [ethers.utils.id("harmony+recovery>1"), 
                                                                otherAccount.address,
                                                                await exchangeContract.refundByUser(otherAccount.address),
                                                                exchangeContract.address,
                                                                tokenContracts[0].address, 
                                                                tokenToBurn]);
            var hash = ethers.utils.keccak256(prehash);
            console.log("Secret hash11=", prehash, hash, tokenContracts[0].address);                                                       

            await expect(exchangeContract.connect(otherAccount).burn(tokenContracts[0].address, tokenToBurn, hash))
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
