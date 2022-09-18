// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./IRecoveryToken.sol";
import "./Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RecoveryOneToken is IRecoveryToken, ReentrancyGuard, ERC20, ERC20Permit, ERC20Votes, Initializable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ERC20 => peg ratio of ONE
    // ratio is in 1.0 = 10,000 UNIT
    uint256 constant DIVISOR = 10000;
    uint256 constant NOTFOUND = 2**256 - 1;
    mapping(IERC20 => uint256) private _ratios;

    // owner => staking positions
    mapping(address => StakeInfo[]) private _stakeBalance;
    bool public locked = false;

    // erc20 => total
    mapping(IERC20 => uint256) public stats;

    constructor(IERC20[] memory tokens, uint256[] memory ratios) ERC20("Recovery One Token", "rONE") ERC20Permit("Recovery One Token")  {
        require(tokens.length == ratios.length);
        for(uint256 i=0; i < tokens.length; i++) {
            _ratios[tokens[i]] = ratios[i];
        }
    }

    // will be transfered to Committee Gnosis wallet
    function mintOnce(address[] calldata accounts, uint256[] calldata amounts) external initializer onlyOwner {
        require(accounts.length == amounts.length);
        for(uint256 i=0; i < accounts.length; i++) {
            _mint(accounts[i], amounts[i]);
        }
    }

    function findStake(StakeInfo[] storage infos, IERC20 erc20) internal view returns (uint256) {
        for(uint256 i=0; i < infos.length; i++) {
            if(infos[i].token == erc20) {
                return i;
            }
        }
        return NOTFOUND;
    }

    function setLocked(bool state) external override onlyOwner {
        locked = state;
    }

    function stake(IERC20 erc20, uint256 amount) external override nonReentrant {
        require(locked == false, "must be unlocked");

        uint256 ratio = _ratios[erc20];
        require(ratio != 0, "not supported");
        
        if (amount > 0) {
            erc20.safeTransferFrom(address(msg.sender), address(this), amount);

            uint256 foundIndex = findStake(_stakeBalance[msg.sender], erc20);
            if (foundIndex == NOTFOUND) {
                _stakeBalance[msg.sender].push(StakeInfo(erc20, 0));
                foundIndex = _stakeBalance[msg.sender].length - 1;
            }

            StakeInfo storage user = _stakeBalance[msg.sender][foundIndex];
            user.amount = user.amount.add(amount);
            uint256 votes = amount.mul(ratio).div(DIVISOR);
            stats[erc20] = stats[erc20].add(amount);
            _mint(msg.sender, votes);

            emit Staked(erc20, amount, votes, msg.sender);
        }
    }
    
    function unstake(IERC20 erc20, uint256 amount) external override nonReentrant {
        uint256 ratio = _ratios[erc20];
        require(ratio != 0, "not supported");

        uint256 foundIndex = findStake(_stakeBalance[msg.sender], erc20);
        require(foundIndex != NOTFOUND, "Token not found");

        StakeInfo storage user = _stakeBalance[msg.sender][foundIndex];
        uint256 newAmount = Math.min(user.amount, amount); // if user does not have enough, we'll use all available

        user.token.safeTransfer(address(msg.sender), newAmount);

        stats[user.token] = stats[user.token].sub(newAmount);
        user.amount -= newAmount;

        uint256 toBurn = newAmount.mul(ratio).div(DIVISOR);
        // calculate tokens to burn
        _burn(msg.sender, toBurn);

        emit Unstaked(erc20, newAmount, toBurn, msg.sender);
    }

    function getBalance(address addr) external override view returns(StakeInfo[] memory) {
        StakeInfo[] storage positions = _stakeBalance[addr];
        StakeInfo[] memory output = new StakeInfo[](positions.length);

        for(uint256 i=0; i < positions.length; i++) {
            output[i] = StakeInfo(positions[i].token, positions[i].amount);
        }
        return output;
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {   
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }    
}