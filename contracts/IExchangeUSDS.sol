// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IExchangeUSDS {
    event BurnToken(address erc20, uint256 amount, address refundToken, uint256 refundAmount);
    
    // WRITE FUNCTIONS: ONLY R1 COMMITTEE CAN UPDATE
    function setLocked(bool state) external;
    function setRateForR1(uint256 rate) external;
    function setRateForNonR1(uint256 rate) external;    
    function setTokenSupport(address erc, bool allowed) external;
    function setRefundMaximumPerWallet(uint256 amount) external;
    function withdraw() external;
    
    // BURN ERC20 and get refund token (USDS)
    function burn(IERC20 erc20, uint256 amount) external;
    
    // READ FUNCTIONS
    function isR1Voter(address voter) external view returns (uint256);
    function calculatePrehackOnePrice(address erc, uint256 amount) external view returns (uint256);
    function getExchangeRate(address owner, address erc20, uint256 amount) external view returns (uint256, bool);    
}