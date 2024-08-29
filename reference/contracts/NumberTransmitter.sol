// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMessageTransmitter.sol";
import "./IMessageHandler.sol";

contract NumberTransmitter is IMessageHandler {
    event SetNumber(
        uint256 number,
        uint32 indexed remoteDomain,
        bytes32 indexed sender
    );

    // Local Message Transmitter responsible for sending and receiving messages to/from remote domains
    IMessageTransmitter public immutable localMessageTransmitter;

    uint256 public myNumber;

    /**
     * @notice Only accept messages from the registered message transmitter on local domain
     */
    modifier onlyLocalMessageTransmitter() {
        // Caller must be the registered message transmitter for this domain
        require(_isLocalMessageTransmitter(), "Invalid message transmitter");
        _;
    }

    constructor(address _messageTransmitter) {
        require(
            _messageTransmitter != address(0),
            "MessageTransmitter not set"
        );
        localMessageTransmitter = IMessageTransmitter(_messageTransmitter);
    }

    function sendNumber(uint256 newNumber, uint32 destinationDomain, bytes32 destinationNumberReceiver) public {
        localMessageTransmitter.sendMessage(
            destinationDomain,
            destinationNumberReceiver,
            abi.encode(newNumber)
        );
    }

    function handleReceiveMessage(
        uint32 remoteDomain,
        bytes32 sender,
        bytes calldata messageBody
    )
        external
        override
        onlyLocalMessageTransmitter
        returns (bool)
    {
        (myNumber) =  abi.decode(messageBody, (uint256));
        emit SetNumber(myNumber, remoteDomain, sender);
        return true;
    }

    function _isLocalMessageTransmitter() internal view returns (bool) {
        return
            address(localMessageTransmitter) != address(0) &&
            msg.sender == address(localMessageTransmitter);
    }
}