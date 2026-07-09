// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract YuiDenSettlement {
    using SafeERC20 for IERC20;

    struct Settlement {
        uint256 id;
        address producer;
        address buyer;
        uint256 kwhScaled;
        uint256 amount;
        string zone;
        uint256 co2SavedGrams;
        uint256 timestamp;
    }

    IERC20 public immutable paymentToken;
    Settlement[] private settlements;

    event EnergySettled(
        uint256 indexed id,
        address indexed producer,
        address indexed buyer,
        uint256 kwhScaled,
        uint256 amount,
        string zone,
        uint256 co2SavedGrams,
        uint256 timestamp
    );

    constructor(address paymentTokenAddress) {
        require(paymentTokenAddress != address(0), "YuiDenSettlement: zero token");
        paymentToken = IERC20(paymentTokenAddress);
    }

    function settleEnergy(
        address producer,
        uint256 kwhScaled,
        uint256 amount,
        string calldata zone,
        uint256 co2SavedGrams
    ) external returns (uint256) {
        require(producer != address(0), "YuiDenSettlement: zero producer");
        require(producer != msg.sender, "YuiDenSettlement: self settlement");
        require(kwhScaled > 0, "YuiDenSettlement: zero kWh");
        require(amount > 0, "YuiDenSettlement: zero amount");

        paymentToken.safeTransferFrom(msg.sender, producer, amount);

        uint256 id = settlements.length + 1;
        uint256 timestamp = block.timestamp;

        settlements.push(
            Settlement({
                id: id,
                producer: producer,
                buyer: msg.sender,
                kwhScaled: kwhScaled,
                amount: amount,
                zone: zone,
                co2SavedGrams: co2SavedGrams,
                timestamp: timestamp
            })
        );

        emit EnergySettled(id, producer, msg.sender, kwhScaled, amount, zone, co2SavedGrams, timestamp);

        return id;
    }

    function getSettlement(uint256 id) external view returns (Settlement memory) {
        require(id > 0 && id <= settlements.length, "YuiDenSettlement: invalid id");
        return settlements[id - 1];
    }

    function getSettlementCount() external view returns (uint256) {
        return settlements.length;
    }
}
