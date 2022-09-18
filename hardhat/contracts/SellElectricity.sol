// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error NotOwner();

contract SellElectricity {
    using PriceConverter for uint256;

    mapping(address => uint256) public addrToMoneySentBy;
    address[] public buyers;
    address public immutable i_owner;

    // uint256 public wattLimit = 50;
    uint256 public actualWattsUsed; //Limited permission
    uint256 public pricePerWatt = 2;
    // uint256 public maxChargeCost;
    uint256 public actualChargeCost; //limited permission
    // uint256 public refundAmount = 0;
    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeed) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeed);
    }

    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert NotOwner();
        _;
    }

    // function setWattLimit(uint256 _watts) public {
    //     wattLimit = _watts;
    // }

    //should be called by owner contract ideally
    function setActualWattsUsed(uint256 _watts) public {
        actualWattsUsed = _watts;
    }

    function setPrice(uint256 _newPrice) public onlyOwner {
        pricePerWatt = _newPrice;
    }

    function calculateCost(uint256 _watts) public view returns (uint256 cost) {
        return _watts * pricePerWatt;
    }

    //Need to get actual amount used and refund if necessary.
    function buy() public payable {
        actualChargeCost = calculateCost(actualWattsUsed);
        require(
            msg.value.getConversionRate(s_priceFeed) >= actualChargeCost,
            "You need to increase payment"
        );
        addrToMoneySentBy[msg.sender] += msg.value;
        buyers.push(msg.sender);
    }

    // function refund() public returns(bool success) {
    //     require(refundAmount > 0);
    //     addrToMoneySentBy[msg.sender] -= refundAmount;
    //     payable(msg.sender).transfer(refundAmount);
    //     refundAmount = 0;
    //     return true;
    // }

    function withdraw() public onlyOwner {
        for (uint256 buyerIndex = 0; buyerIndex < buyers.length; buyerIndex++) {
            address buyer = buyers[buyerIndex];
            addrToMoneySentBy[buyer] = 0;
        }
        buyers = new address[](0);
        //Transfer funds from contract to owner
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    //Functions to redirect if an account tries sending money directly to contract address.
    fallback() external payable {
        buy();
    }

    receive() external payable {
        buy();
    }
}
