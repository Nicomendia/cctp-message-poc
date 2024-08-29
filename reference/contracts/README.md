# Cross-chain NumberMessenger deployed contracts

## Overview

This section shows the contracts used to send an arbitrary number from ETH testnet to a contract deployed on AVAX testnet.

To do so, [NumberTransmitter](./NumberTransmitter.sol) contract was deployed with [Remix](https://remix.ethereum.org/) on the following networks/addresses:
- Sepolia: [0xd199bfCd4AFA63612808b494Db39564fE753e2F0](https://sepolia.etherscan.io/address/0xd199bfCd4AFA63612808b494Db39564fE753e2F0)
- Avalanche: [0xfC6919769aF594Bc89E766CAe911E836cdF467F1](https://testnet.snowtrace.io/address/0xfC6919769aF594Bc89E766CAe911E836cdF467F1)

### Circle CCTP

Looking deeply into CCTP's [Generalized Message Passing](https://developers.circle.com/stablecoins/docs/generic-message-passing) and its architecture, we identified the possibility to use it as a cross-chain arbitrary message transmitter, enabling seamless interoperability between various blockchain networks, allowing not only the transfer of digital assets like ERC20 tokens across different platforms, but also the execution of cross-chain commands.

Therefore, our [NumberTransmitter](./NumberTransmitter.sol) contracts deployed in both networks use, in turn, the [MessageTransmitter](https://github.com/circlefin/evm-cctp-contracts/blob/master/src/MessageTransmitter.sol) contract deployed by [Circle](https://developers.circle.com/stablecoins/docs/evm-smart-contracts#messagetransmitter-testnet) on:
- Sepolia: [0x7865fAfC2db2093669d92c0F33AeEF291086BEFD](https://sepolia.etherscan.io/address/0x7865fAfC2db2093669d92c0F33AeEF291086BEFD)
- Avalanche: [0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79](https://testnet.snowtrace.io/address/0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79)

In order of being able to achieve the sending of messages from a network to another, we took advantage of the mentioned MessageTransmitter contract implemented by CCTP, and the [Circle attestation API](https://developers.circle.com/stablecoins/docs/cctp-getting-started#attestation-service-api).