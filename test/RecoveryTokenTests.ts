import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("RecoveryToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function simpleFixture() {

    // Contracts are deployed using the first signer/account by default
    const DIVISOR = 10000;
    const [owner, otherAccount] = await ethers.getSigners();
    const ERCMock = await ethers.getContractFactory("ERCMock");
    const erc0 = await ERCMock.deploy("erc0", "erc0");
    const erc1 = await ERCMock.deploy("erc1", "erc1");

    const tokens = [erc0.address, erc1.address];
    const ratios = [50*DIVISOR, 300*DIVISOR];
    const RecoveryToken = await ethers.getContractFactory("RecoveryToken");
    const recoveryToken = await RecoveryToken.deploy(tokens, ratios);
    const tokenContracts = [erc0, erc1];
    return { recoveryToken, tokenContracts, ratios, owner, otherAccount };
  }


  describe("Core Functionalities", function () {
    it("Staking & Unstake", async function () {
      const { recoveryToken, tokenContracts, ratios, owner, otherAccount } = await loadFixture(simpleFixture);
      var token0StartBalance = await tokenContracts[1].balanceOf(owner.address);

      var stakeAmount =  ethers.utils.parseEther("1");
      await tokenContracts[0].approve(recoveryToken.address, stakeAmount);
      var stakeAction = recoveryToken.stake(tokenContracts[0].address,  stakeAmount);

      await expect(stakeAction)
        .to.emit(recoveryToken, "Staked")
        .withArgs(tokenContracts[0].address, stakeAmount, ethers.BigNumber.from(stakeAmount).mul(50), owner.address);

      var res = await recoveryToken.getBalance(owner.address);
      expect(res[0].token).to.equal(tokenContracts[0].address)
      expect(res[0].amount).to.equal(ethers.BigNumber.from(stakeAmount))

      // STAKE MORE
      await tokenContracts[1].approve(recoveryToken.address, stakeAmount)
      var stakeAction = recoveryToken.stake(tokenContracts[1].address,  stakeAmount);
      await expect(stakeAction)
        .to.emit(recoveryToken, "Staked")
        .withArgs(tokenContracts[1].address, stakeAmount, ethers.BigNumber.from(stakeAmount).mul(300), owner.address);
      
      var res = await recoveryToken.getBalance(owner.address)
      expect(res.length).to.equal(2);
      expect(res[1].token).to.equal(tokenContracts[1].address)
      expect(res[1].amount).to.equal(ethers.BigNumber.from(stakeAmount))

      // STAKE FIRST TOKEN AGAIN
      var stakeAmount2 =  ethers.utils.parseEther("0.5");
      await tokenContracts[0].approve(recoveryToken.address, stakeAmount2);
      var stakeAction = recoveryToken.stake(tokenContracts[0].address,  stakeAmount2);

      await expect(stakeAction)
        .to.emit(recoveryToken, "Staked")
        .withArgs(tokenContracts[0].address, stakeAmount2, ethers.BigNumber.from(stakeAmount2).mul(50), owner.address);

      var res = await recoveryToken.getBalance(owner.address)
      //console.log(res)
      expect(res.length).to.equal(2);
      expect(res[0].token).to.equal(tokenContracts[0].address)
      expect(res[0].amount).to.equal(ethers.BigNumber.from(stakeAmount).add(ethers.BigNumber.from(stakeAmount2)))        

      // VERIFY VOTES
      var votes = await recoveryToken.getRootVotes(owner.address)
      expect(votes).to.equal(ethers.BigNumber.from(ethers.utils.parseEther("1.5")).mul(50)
                        .add(ethers.BigNumber.from(ethers.utils.parseEther("1")).mul(300)))


      // UNSTAKE ALL
      const token0Amount = ethers.BigNumber.from(ethers.utils.parseEther("1.0"))
      await expect(recoveryToken.unstake(tokenContracts[0].address, token0Amount)).to
              .emit(recoveryToken, "Unstaked")
              .withArgs(tokenContracts[0].address, token0Amount, ethers.BigNumber.from(token0Amount).mul(50), owner.address)
              .changeTokenBalances(
                tokenContracts[0],
                [recoveryToken, owner.address],
                [token0Amount.mul(-1), token0Amount]
              )

      var votes = await recoveryToken.getRootVotes(owner.address)
      expect(votes).to.equal(ethers.BigNumber.from(ethers.utils.parseEther("0.5")).mul(50)
                        .add(ethers.BigNumber.from(ethers.utils.parseEther("1")).mul(300)))

      // UNSTAKE OVER, should floor
      const token1Amount = ethers.BigNumber.from(ethers.utils.parseEther("1.0"))
      await expect(recoveryToken.unstake(tokenContracts[1].address, token1Amount.add(ethers.utils.parseEther("5.0")))).to
              .emit(recoveryToken, "Unstaked")
              .withArgs(tokenContracts[1].address, token1Amount, ethers.BigNumber.from(token1Amount).mul(300), owner.address)
              .changeTokenBalances(
                tokenContracts[1],
                [recoveryToken, owner.address],
                [token1Amount.mul(-1), token1Amount]
              )

      expect((await tokenContracts[1].balanceOf(owner.address)).sub(token0StartBalance)).to.equal(0);
      
    });
  });
});
