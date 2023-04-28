// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ERCMock is ERC20Burnable {
    uint8 dec;
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        dec = decimals_;
        _mint(msg.sender, 100000000 ether);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return dec;
    }    

}