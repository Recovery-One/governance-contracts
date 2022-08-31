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

contract RecoveryToken is IRecoveryToken, ReentrancyGuard, ERC20, ERC20Permit, ERC20Votes, Initializable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ERC20 => peg ratio of ONE
    // ratio is in 1.0 = 10,000 UNIT
    uint256 constant DIVISOR = 10000;
    uint256 constant NOTFOUND = 2**256 - 1;
    mapping(IERC20 => uint256) private _ratios;
    IERC20[] private _supported;

    // owner => staking positions
    mapping(address => StakeInfo[]) private _stakeBalance;

    // owner => vote count
    mapping(address => uint256) private _voteCount;

    // erc20 => total
    mapping(IERC20 => uint256) private _stats;

    constructor(IERC20[] memory tokens, uint256[] memory ratios) ERC20("Recovery One Token", "rONE") ERC20Permit("Recovery One Token")  {
        require(tokens.length == ratios.length);
        for(uint256 i=0; i < tokens.length; i++) {
            _ratios[tokens[i]] = ratios[i];
            _supported.push(tokens[i]);
        }
    }

    function mintOnce(address[] calldata accounts, uint256[] calldata amounts) external initializer {
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

    function stake(IERC20 erc20, uint256 amount) external override nonReentrant {
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
            _voteCount[msg.sender] = _voteCount[msg.sender].add(votes);
            _stats[erc20] = _stats[erc20].add(amount);
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
        uint256 newAmount = Math.min(user.amount, amount); // floor it

        user.token.safeApprove(address(this),newAmount);
        user.token.safeTransferFrom(address(this), address(msg.sender), newAmount);

        _stats[user.token] = _stats[user.token].sub(newAmount);
        user.amount -= newAmount;

        uint256 toBurn = newAmount.mul(ratio).div(DIVISOR);
        // calculate tokens to burn
        _burn(msg.sender, toBurn);
        _voteCount[msg.sender] = _voteCount[msg.sender].sub(toBurn);

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

    function getRootVotes(address addr) external override view returns(uint256) {
        return _voteCount[addr];
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