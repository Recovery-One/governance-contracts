// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * Contract is for tally 
 */
interface IRecoveryToken is IERC20 {
    event Staked(IERC20 erc20, uint256 amount, uint256 votes, address from);
    event Unstaked(IERC20 erc20, uint256 amount, uint256 votes, address from);

    struct StakeInfo {
        IERC20 token;
        uint256 amount;
    }

    function stake(IERC20 erc20, uint256 amount) external;

    function unstake(IERC20 erc20, uint256 amount) external;

    function getBalance(address addr) external view returns(StakeInfo[] memory);

}