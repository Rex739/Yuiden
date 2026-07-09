// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1_000 ether;

    constructor() ERC20("YuiDen Mock USDT", "mUSDT") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function faucet(address account) external {
        require(account != address(0), "MockUSDT: zero address");
        _mint(account, FAUCET_AMOUNT);
    }
}
