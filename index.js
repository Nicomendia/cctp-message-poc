require("dotenv").config();
const Web3 = require('web3')

const numberTransmitterAbi = require('./abis/cctp/NumberTransmitter.json');
const messageAbi = require('./abis/cctp/Message.json');
const messageTransmitterAbi = require('./abis/cctp/MessageTransmitter.json');

const waitForTransaction = async(web3, txHash) => {
    let transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
    while(transactionReceipt != null && transactionReceipt.status === 'FALSE') {
        transactionReceipt = await web3.eth.getTransactionReceipt(txHash);
        await new Promise(r => setTimeout(r, 4000));
    }
    return transactionReceipt;
}

const main = async() => {
    const web3 = new Web3(process.env.ETH_TESTNET_RPC);

    // Add ETH private key used for signing transactions
    const ethSigner = web3.eth.accounts.privateKeyToAccount(process.env.ETH_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(ethSigner);

    // Add AVAX private key used for signing transactions
    const avaxSigner = web3.eth.accounts.privateKeyToAccount(process.env.AVAX_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(avaxSigner);

    // MessageTransmitter: Testnet
    // Chain               Domain  Address
    // Ethereum Sepolia    0	   0x7865fAfC2db2093669d92c0F33AeEF291086BEFD
    // Avalanche Fuji      1       0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79

    // NumberTransmitter: Testnet
    // Chain               Address
    // Ethereum Sepolia    0xd199bfCd4AFA63612808b494Db39564fE753e2F0
    // Avalanche Fuji      0xfC6919769aF594Bc89E766CAe911E836cdF467F1

    // Testnet Contract Addresses
    const ETH_NUMBER_TRANSMITTER_CONTRACT_ADDRESS = '0xd199bfCd4AFA63612808b494Db39564fE753e2F0';
    const ETH_MESSAGE_CONTRACT_ADDRESS = '0x80537e4e8bab73d21096baa3a8c813b45ca0b7c9';
    const AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS = '0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79';
    const AVAX_NUMBER_TRANSMITTER_CONTRACT_ADDRESS = '0xfC6919769aF594Bc89E766CAe911E836cdF467F1';

    // initialize contracts using address and ABI
    const ethNumberTransmitterContract = new web3.eth.Contract(numberTransmitterAbi, ETH_NUMBER_TRANSMITTER_CONTRACT_ADDRESS, {from: ethSigner.address});
    const ethMessageContract = new web3.eth.Contract(messageAbi, ETH_MESSAGE_CONTRACT_ADDRESS, {from: ethSigner.address});
    const avaxMessageTransmitterContract = new web3.eth.Contract(messageTransmitterAbi, AVAX_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS, {from: avaxSigner.address});

    // // AVAX NumberTransmitter address in bytes32 representation
    const destinationNumberTransmitterInBytes32 = await ethMessageContract.methods.addressToBytes32(AVAX_NUMBER_TRANSMITTER_CONTRACT_ADDRESS).call();
    const AVAX_DESTINATION_DOMAIN = 1;

    // Number that will be sent
    const number = process.env.NUMBER;

    // STEP 1: Send number
    const sendNumberTxGas = await ethNumberTransmitterContract.methods.sendNumber(number, AVAX_DESTINATION_DOMAIN, destinationNumberTransmitterInBytes32).estimateGas();
    const sendNumberTx = await ethNumberTransmitterContract.methods.sendNumber(number, AVAX_DESTINATION_DOMAIN, destinationNumberTransmitterInBytes32).send({gas: sendNumberTxGas});
    const SendNumberTxReceipt = await waitForTransaction(web3, sendNumberTx.transactionHash);
    console.log('SendNumberTxReceipt: ', SendNumberTxReceipt)

    // STEP 2: Retrieve message bytes from logs
    const transactionReceipt = await web3.eth.getTransactionReceipt(sendNumberTx.transactionHash);
    const eventTopic = web3.utils.keccak256('MessageSent(bytes)')
    const log = transactionReceipt.logs.find((l) => l.topics[0] === eventTopic)
    const messageBytes = web3.eth.abi.decodeParameters(['bytes'], log.data)[0]
    const messageHash = web3.utils.keccak256(messageBytes);

    console.log(`MessageBytes: ${messageBytes}`)
    console.log(`MessageHash: ${messageHash}`)

    // STEP 3: Fetch attestation signature
    let attestationResponse = {status: 'pending'};
    while(attestationResponse.status != 'complete') {
        const response = await fetch(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`);
        attestationResponse = await response.json()
        await new Promise(r => setTimeout(r, 2000));
    }

    const attestationSignature = attestationResponse.attestation;
    console.log(`Signature: ${attestationSignature}`)

    // STEP 4: Using the message bytes and signature recieve the funds on destination chain and address
    web3.setProvider(process.env.AVAX_TESTNET_RPC); // Connect web3 to AVAX testnet
    const receiveTxGas = await avaxMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).estimateGas();
    const receiveTx = await avaxMessageTransmitterContract.methods.receiveMessage(messageBytes, attestationSignature).send({gas: receiveTxGas});
    const receiveTxReceipt = await waitForTransaction(web3, receiveTx.transactionHash);
    console.log('ReceiveTxReceipt: ', receiveTxReceipt)
};

main()
