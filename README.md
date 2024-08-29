
# Quickstart: Cross-chain Number Messenger

## Overview

This example uses [web3.js](https://web3js.readthedocs.io/en/v1.8.1/getting-started.html) to send an arbitrary number from an address on ETH testnet to another address on AVAX testnet.

### Prerequisite
The script requires [Node.js](https://nodejs.org/en/download/) installed.

## Usage
1. Install dependencies by running `npm install`
2. Create a `.env` file and add below variables to it:
    ```js
    ETH_TESTNET_RPC=<ETH_TESTNET_RPC_URL>
    AVAX_TESTNET_RPC=<AVAX_TESTNET_RPC_URL>
    ETH_PRIVATE_KEY=<ADD_ORIGINATING_ADDRESS_PRIVATE_KEY>
    AVAX_PRIVATE_KEY=<ADD_RECEIPIENT_ADDRESS_PRIVATE_KEY>
    RECIPIENT_ADDRESS=<ADD_RECEIPIENT_ADDRESS_FOR_AVAX>
    NUMBER=<ADD_NUMBER_TO_BE_SENT>
    ```
3. Run the script by running `npm run start`

## Script Details
The script has 4 steps:
1. First step executes `sendNumber` function on `NumberTransmitterContract` deployed in [Sepolia testnet](https://sepolia.etherscan.io/address/0xd199bfCd4AFA63612808b494Db39564fE753e2F0)
    ```js
    const sendNumberTx = await ethNumberTransmitterContract.methods.sendNumber(number, AVAX_DESTINATION_DOMAIN, destinationNumberTransmitterInBytes32).send();
    ```

2. Second step extracts `messageBytes` emitted by `MessageSent` event from `sendNumber` transaction logs and hashes the retrieved `messageBytes` using `keccak256` hashing algorithm
    ```js
    const transactionReceipt = await web3.eth.getTransactionReceipt(sendNumberTx.transactionHash);
    const eventTopic = web3.utils.keccak256('MessageSent(bytes)')
    const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic)
    const messageBytes = web3.eth.abi.decodeParameters(['bytes'], log.data)[0]
    const messageHash = web3.utils.keccak256(messageBytes);
    ```

3. Third step polls the attestation service to acquire signature using the `messageHash` from previous step.
    ```js
    let attestationResponse = {status: 'pending'};
    while(attestationResponse.status != 'complete') {
        const response = await fetch(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`);
        attestationResponse = await response.json()
        await new Promise(r => setTimeout(r, 2000));
    }
    ```

4. Last step calls `receiveMessage` function on `MessageTransmitterContract` deployed in [Avalanche Fuji Network](https://testnet.snowtrace.io/address/0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79) to set the provided number at AVAX `NumberTransmitterContract` also deployed in [Avalanche Fuji Network](https://testnet.snowtrace.io/address/0xfC6919769aF594Bc89E766CAe911E836cdF467F1).

    *Note: The attestation service is rate-limited, please limit your requests to less than 1 per second.*
    ```js
    const receiveTx = await avaxMessageTransmitterContract.receiveMessage(receivingMessageBytes, signature);
    ```