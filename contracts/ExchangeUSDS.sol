// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./IExchangeUSDS.sol";
import "./IERC20Burnable.sol";

contract ExchangeUSDS is IExchangeUSDS, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    using SafeMath for uint256;
    using SafeERC20Upgradeable for IERC20;

    uint256 constant DIVISOR = 10000;
    uint256 constant NOTFOUND = 2**256 - 1;
    
    mapping(address => uint256) public ratios;
    mapping(address => uint256) public rONEVoters;
    mapping(address => bool) public supported;
    
    // address => total refunded so far
    mapping(address => uint256) public refundByUser;
    
    // erc20 => total amount
    mapping(address => uint256) public refundByToken;
    
    address public refundToken;
    uint256 public pegRateRONE;
    uint256 public pegRateNonRONE;
    uint256 public refundMaxPerAddress;
    bool public locked;
    uint256 public deltaDec;
    
    constructor() {
    }
    
    function initialize(address[] memory voterAddresses, uint256[]  memory votes,
                address[] memory tokens, uint256[] memory _ratios, address _refundToken, uint256 _refundMaxPerAddress) external initializer         
    {
        __Ownable_init();
        __ReentrancyGuard_init();
        
        for(uint256 i=0; i < voterAddresses.length; i++) {
            rONEVoters[voterAddresses[i]] = votes[i];
        }

        require(tokens.length == _ratios.length);
        for(uint256 i=0; i < tokens.length; i++) {
            ratios[tokens[i]] = _ratios[i];
        }
        refundToken = _refundToken;
        refundMaxPerAddress = _refundMaxPerAddress;
        deltaDec = 10**(18-IERC20Metadata(_refundToken).decimals());
    }

    function setRefundToken(address erc) external override onlyOwner {
        refundToken = erc;
    }

    function setLocked(bool state) external override onlyOwner {
        locked = state;
    }
        
    function setRateForR1(uint256 rate) external override onlyOwner {
        pegRateRONE = rate;
    }
    
    function setRateForNonR1(uint256 rate) external override onlyOwner {
        pegRateNonRONE = rate;        
    }
    
    function setTokenSupport(address erc, bool allowed) external override onlyOwner {
        supported[erc] = allowed;
    }
    
    function setRefundMaximumPerWallet(uint256 _refundMaxPerAddress) external override onlyOwner {
        refundMaxPerAddress = _refundMaxPerAddress;        
    }
    
    function withdraw() external override onlyOwner {
        IERC20(refundToken).transfer(owner(), IERC20(refundToken).balanceOf(address(this)));            
    }
    
    function burn(IERC20 erc20, uint256 amount) external override nonReentrant {
        require(locked == false, "must be unlocked");
        require(supported[address(erc20)] == true, "token not supported");
        
        IERC20Burnable(address(erc20)).burnFrom(msg.sender, amount);
        
        (uint256 refundAmount, ) = this.getExchangeRate(msg.sender, address(erc20), amount);
        require(refundByUser[msg.sender] + refundAmount < refundMaxPerAddress, "Maximum per address reached");

        IERC20(refundToken).transfer(msg.sender, refundAmount);

        refundByUser[msg.sender] += refundAmount;
        refundByToken[address(erc20)] += amount;
        
        emit BurnToken(address(erc20), amount, refundToken, refundAmount);
    }
        
    function calculatePrehackOnePrice(address erc20, uint256 amount) external override view returns (uint256) {
        uint256 ratio = ratios[erc20];
        require(ratio != 0, "not supported");
        uint256 rONE = amount.mul(ratio).div(DIVISOR);
        return rONE;   
    }
    
    function isR1Voter(address voter) external override view returns (uint256) {
        return rONEVoters[voter];
    }
    
    function getExchangeRate(address owner, address erc20, uint256 amount) external override view returns (uint256, bool) {
        uint256 OneAmount = this.calculatePrehackOnePrice(address(erc20), amount);
        bool qualified = this.isR1Voter(owner) > 0;
        uint256 rate = qualified ? pegRateRONE : pegRateNonRONE;
        uint256 refundAmount = OneAmount.mul(rate).div(DIVISOR);
        
        uint8 targetDec = IERC20Metadata(erc20).decimals();
        uint8 refundDec = IERC20Metadata(refundToken).decimals();
        if(targetDec > refundDec) {
            uint256 deltaDec_ = 10**(targetDec - refundDec);            
            refundAmount = refundAmount.div(deltaDec_);
        }
        else if(refundDec > targetDec) {
            uint256 deltaDec_ = 10**(refundDec - targetDec);            
            refundAmount = refundAmount.mul(deltaDec_);            
        }

        return (refundAmount, qualified);
    }
    
}