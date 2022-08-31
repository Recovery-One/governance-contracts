import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { mine, mineUpTo } from "@nomicfoundation/hardhat-network-helpers";

enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Expired,
    Executed
}

describe("RecoveryToken", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function simpleFixture() {
        const [owner, committeeAccount] = await ethers.getSigners();

        const DIVISOR = 10000;
        const ERCMock = await ethers.getContractFactory("ERCMock");
        const erc0 = await ERCMock.deploy("erc0", "erc0");
        const erc1 = await ERCMock.deploy("erc1", "erc1");

        const tokens = [erc0.address, erc1.address];
        const ratios = [50*DIVISOR, 300*DIVISOR];

        const RecoveryToken = await ethers.getContractFactory("RecoveryToken");
        const recoveryToken = await RecoveryToken.deploy(tokens, ratios);
        
        console.log("Create governance contract", recoveryToken.address, committeeAccount.address);

        const Governance = await ethers.getContractFactory("Governance");
        const governance = await Governance.deploy(recoveryToken.address, committeeAccount.address, {gasLimit: 30000000});

        console.log("Deployed to ", governance.address);
        await recoveryToken.mintOnce([committeeAccount.address, governance.address], [ethers.utils.parseEther("250"), ethers.utils.parseEther("250")]) 

        return {governance, recoveryToken, tokens, owner, committeeAccount}
    }

    describe("Core Functionalities", function () {
        it("Correct initial mints", async function () {
            const {governance, recoveryToken, tokens, owner, committeeAccount} = await loadFixture(simpleFixture);
            expect(await recoveryToken.balanceOf(governance.address)).to.equal(ethers.utils.parseEther("250"));
            expect(await recoveryToken.balanceOf(committeeAccount.address)).to.equal(ethers.utils.parseEther("250"));
        });
        it("non-committee can't propose", async function () {
            const {governance, recoveryToken, tokens, owner, committeeAccount} = await loadFixture(simpleFixture);
            await expect(governance.propose([owner.address],["1"], ["0x"], "send 1 wei")).to.be.revertedWith("ONLY COMMITTEE CAN PROPOSE")
        });
        it("committee can propose, test for voting rights, and execute proposal", async function () {
            const grantee = ethers.Wallet.createRandom();
            const {governance, recoveryToken, tokens, owner, committeeAccount} = await loadFixture(simpleFixture);
            const callData = recoveryToken.interface.encodeFunctionData("approve",[grantee.address, ethers.utils.parseEther("25")])
            const callData2 = recoveryToken.interface.encodeFunctionData("transfer",[grantee.address, ethers.utils.parseEther("25")])

            const {targets, values, calls}: any = {targets: [recoveryToken.address, recoveryToken.address], values: [0, 0], calls: [callData, callData2]};
            var tx = await (await governance.connect(committeeAccount).propose(targets, values, calls, "send 25 rONE")).wait();
            const proposalId = tx.events?.[0].args?.proposalId;

            const voter = committeeAccount;
            await recoveryToken.connect(voter).delegate(voter.address);
            console.log("Voter Balance =", await recoveryToken.balanceOf(voter.address))
            console.log("Eligible votes=", await recoveryToken.getVotes(voter.address));
            console.log("Checkpoints=", await recoveryToken.numCheckpoints(voter.address))

            expect(await recoveryToken.balanceOf(voter.address)).to.equal(ethers.utils.parseEther("250"));
            await mineUpTo(10);

            //account, proposalId, support
            await expect(governance.connect(voter).castVote(proposalId, 1)).to
            .emit(governance, "VoteCast")
            .withArgs(voter.address, proposalId, 1, anyValue, anyValue)

            expect(await governance.state(proposalId)).to.be.equal(ProposalState.Active)
            
            const deadline = await governance.proposalDeadline(proposalId);
            console.log("Deadline=", deadline)

            const [against, forvotes, abstain] = await governance.proposalVotes(proposalId);
            console.log("Votes Tally (FOR)=", forvotes);

            await mineUpTo(deadline.add(1));

            expect(await governance.state(proposalId)).to.be.equal(ProposalState.Succeeded)

            await expect(governance.connect(committeeAccount).execute(targets, values, calls, ethers.utils.keccak256(ethers.utils.toUtf8Bytes("send 25 rONE"))))
                    .to.emit(governance, "ProposalExecuted")
                    .withArgs(proposalId)

            expect(await governance.state(proposalId)).to.be.equal(ProposalState.Executed)
            expect(await recoveryToken.balanceOf(grantee.address)).to.equal(ethers.utils.parseEther("25"));

        });

    })
});