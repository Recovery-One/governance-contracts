// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ERCMock is ERC20Burnable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100000000 ether);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }    

}