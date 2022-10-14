// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IExchangeUSDS.sol";
import "./IERC20Burnable.sol";

contract ExchangeUSDS is IExchangeUSDS, ReentrancyGuard, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 constant DIVISOR = 10000;
    uint256 constant NOTFOUND = 2**256 - 1;
    
    mapping(address => uint256) public ratios;
    mapping(address => uint256) public rONEVoters;
    mapping(address => bool) public supported;
    
    // address => total refunded so far
    mapping(address => uint256) public refundStats;
    
    address public refundToken;
    uint256 public pegRateRONE;
    uint256 public pegRateNonRONE;
    uint256 public refundMaxPerAddress;
    bool public locked = false;
    
    constructor(address[] memory voterAddresses, uint256[]  memory votes,
                address[] memory tokens, uint256[] memory _ratios, address _refundToken, uint256 _refundMaxPerAddress) {
        for(uint256 i=0; i < voterAddresses.length; i++) {
            rONEVoters[voterAddresses[i]] = votes[i];
        }

        require(tokens.length == _ratios.length);
        for(uint256 i=0; i < tokens.length; i++) {
            ratios[tokens[i]] = _ratios[i];
        }
        refundToken = _refundToken;
        refundMaxPerAddress = _refundMaxPerAddress;
    }

    function setLocked(bool state) external override onlyOwner {
        locked = state;
    }
        
    function setRateForR1(uint256 rate) external onlyOwner {
        pegRateRONE = rate;
    }
    
    function setRateForNonR1(uint256 rate) external onlyOwner {
        pegRateNonRONE = rate;        
    }
    
    function setTokenSupport(address erc, bool allowed) external onlyOwner {
        supported[erc] = allowed;
    }
    
    function setRefundMaximumPerWallet(uint256 _refundMaxPerAddress) external onlyOwner {
        refundMaxPerAddress = _refundMaxPerAddress;        
    }
    
    function burn(IERC20 erc20, uint256 amount) external nonReentrant {
        require(locked == false, "must be unlocked");
        require(supported[address(erc20)] == true, "token not supported");
        
        erc20.safeTransferFrom(address(msg.sender), address(this), amount);
        
        (uint256 refundAmount, ) = this.getExchangeRate(address(erc20), amount);
        IERC20(refundToken).safeTransferFrom(address(this), msg.sender, refundAmount);
        IERC20Burnable(address(erc20)).burn(amount);
        
        emit BurnToken(address(erc20), amount, refundToken, refundAmount);
    }
        
    function calculatePrehackOnePrice(address erc20, uint256 amount) external view returns (uint256) {
        uint256 ratio = ratios[erc20];
        require(ratio != 0, "not supported");
        uint256 rONE = amount.mul(ratio).div(DIVISOR);
        return rONE;   
    }
    
    function isR1Voter(address voter) external view returns (uint256) {
        return rONEVoters[voter];
    }
    
    function getExchangeRate(address erc20, uint256 amount) external view returns (uint256, bool) {
        uint256 OneAmount = this.calculatePrehackOnePrice(address(erc20), amount);
        bool qualified = this.isR1Voter(msg.sender) > 0;
        uint256 rate = qualified ? pegRateRONE : pegRateNonRONE;
        uint256 refundAmount = OneAmount.mul(rate).div(DIVISOR);
        return (refundAmount, qualified);
    }
    
}