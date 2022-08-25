import { developmentChains, proposalFile, VOTING_PERIOD } from "../helper-hardhat-config";
import * as fs from "fs";
import { ethers, network } from "hardhat";
import { moveBlocks } from "../utils/move-block";


const index = 0; // 1st in our proposals.json

async function main(proposalIndex: number) {
    const proposals =JSON.parse(fs.readFileSync(proposalFile, "utf8"));
    const proposalId = proposals[network.config.chainId!][proposalIndex];
    // 0 = against, 1 = For, 2 = Abstain
    const voteWay = 1;
    const governor = await ethers.getContract("GovernorContract");
    const reason = "This proposal seems good I like it";
    const voteTxResponse = await governor.castVoteWithReason(proposalId, voteWay, reason);
    await voteTxResponse.wait(1);
    if(developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1);
    }
    console.log("Successfully Voted !!!!!");
}

main(index)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1);
    })