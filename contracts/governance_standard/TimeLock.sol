//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

// This is gonna be additional contract that is the OWNER of the Box contract
// We want to wait for a new vote to be executed
// Give time to users to not participate if they don't like a governance update

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {

    constructor(
        // minDelay: How long you must wait before executing 
        uint256 minDelay,
        // proposers is the list of addresses that can propose
        address[] memory proposers,
        // executors: Who can execute when a proposal passes
        address[] memory executors
    ) TimelockController(minDelay, proposers, executors) {}
}