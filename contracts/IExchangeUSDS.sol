// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

interface IExchangeUSDS {
    event BurnToken(address erc20, uint256 amount, address refundToken, uint256 refundAmount);
    
    function setLocked(bool state) external;
    function setRateForR1(uint256 rate) external;
    function setRateForNonR1(uint256 rate) external;    
    function setTokenSupport(address erc, bool allowed) external;
    function setRefundMaximumPerWallet(uint256 amount) external;
    
    function isR1Voter(address voter) external view returns (uint256);
    function calculatePrehackOnePrice(address erc, uint256 amount) external view returns (uint256);
}