import { GovernorContract, GovernanceToken, TimeLock, Box } from "../typechain-types";
import { deployments, ethers } from "hardhat";
import { assert, expect } from "chai";
import {FUNC, PROPOSAL_DESCRIPTION, NEW_STORE_VALUE, VOTING_DELAY, VOTING_PERIOD, MIN_DELAY } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-block";
import { moveTime } from "../utils/move-time";
import {} from 'jasmine';

describe("Governance Process", async function () {
    let governor: GovernorContract;
    let governanceToken: GovernanceToken;
    let timeLock: TimeLock;
    let box: Box;
    const voteWay = 1; // Vote for proposal
    const reason = "I agree with the proposal";

    beforeEach(async () => {
        await deployments.fixture(["all"])
        governor = await ethers.getContract("GovernorContract")
        timeLock = await ethers.getContract("TimeLock")
        governanceToken = await ethers.getContract("GovernanceToken")
        box = await ethers.getContract("Box")
    })

    it("Can be changed only using governance", async() => {
        await expect(box.store(55)).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("Proposes, votes, waits, queues, and then executes", async () => {
        // Propose
        const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, [NEW_STORE_VALUE])
        const proposeTX = await governor.propose(
            [box.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        )

        const proposeReceipt = await proposeTX.wait(1)
        const proposalId = proposeReceipt.events![0].args!.proposalId
        let proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State is: ${proposalState}`)
        await moveBlocks(VOTING_DELAY + 1)

        // Vote
        const voteTX = await governor.castVoteWithReason(proposalId, voteWay, reason)
        await voteTX.wait(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "1")
        console.log(`Current proposal State: ${proposalState}`)
        await moveBlocks(VOTING_PERIOD + 1)

        // Queue and Execute
        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
        const queueTx = await governor.queue([box.address], [0], [encodedFunctionCall], descriptionHash)
        await queueTx.wait(1)
        await moveTime(MIN_DELAY + 1)
        await moveBlocks(1)

        proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        console.log("Executing...................")
        const exTx = await governor.execute([box.address], [0], [encodedFunctionCall], descriptionHash)
        await exTx.wait(1)
        console.log((await box.retrieve()).toString())
    })
})