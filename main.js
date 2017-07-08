const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const Async = require('async');
var program = require('commander');

const Intention = require('./dto/intention.js');
const BlockchainUtils = require('./utils/blockchain.js');
const ContractFactory = require('./utils/contractFactory.js');

const BLOCK_OFFSET = 10;
const ICO_DURATION = 1000;
var currentBlockNumber = 0;
var contractAddress;
var tokenAddress;
var startBlock;

// Private functions
var gatherIntentionsPerBlock = function (intentions) {
    const intentionsMap = new Map();

    for (let intention of intentions) {
        let blockNumber = intention.blockNumber;
        let existingIntentions = intentionsMap.get(blockNumber);
        if (existingIntentions !== undefined) {
            existingIntentions.push(intention);
        } else {
            intentionsMap.set(blockNumber, [intention]);
        }
    }

    return intentionsMap;
};

// Public functions
var run = function () {
    program
        .version('0.0.1')
        .option('-i, --ico', 'The type of ICO contract to model.')
        .option('-b, --behavior', 'The behavior of the actors to model.')
        .parse(process.argv);

    var intentionsMap;
    // Create the ICO contract and token
    return BlockchainUtils.getCurrentBlockNumber()
        .then( (currentBlockNumber) => {
            console.log("CURRENT BLOCK NUMBER");
            console.log(currentBlockNumber);
            startBlock = currentBlockNumber + BLOCK_OFFSET;
            console.log("START BLOCK");
            console.log(startBlock);
            let endBlock = startBlock + ICO_DURATION;
            console.log("END BLOCK");
            console.log(endBlock);
            return ContractFactory.createNewContractInstance("CrowdSale", startBlock, endBlock, '0x89488494f2f4d66289215c674ab08448919d69cc');
        })
        .then( (contractInstanceDetails) => {
            contractAddress = contractInstanceDetails.contract;
            tokenAddress = contractInstanceDetails.token;
            return fs.readFileAsync('./resources/intentions/intentions.json')
        })
        .then((intentionsData) => {
            let intentions = Intention.marshalIntentions(intentionsData);
            intentionsMap = gatherIntentionsPerBlock(intentions);
            let blockNumbers = intentionsMap.keys();

            return new Promise( (resolve, reject) => {
                Async.each(
                    // Iterable
                    blockNumbers,
                    // Action to be performed on each item
                    function (offset) {
                        // BlockNumber is now treated as an offset
                        let blockNumber = startBlock + offset;
                        Async.until(
                            // Function to call to check if we have reached the correct block height for this batch of intentions
                            function () {
                                return currentBlockNumber >= blockNumber;
                            },
                            // Function to be called to find out what the block height is
                            function (cb) {
                                return BlockchainUtils.getCurrentBlockNumber()
                                    .then((_blockNumber) => {
                                        currentBlockNumber = _blockNumber;
                                        cb();
                                    })
                            },
                            // Function that is called once we reach the desired block height - queue up the transactions to be sent
                            () => {
                                console.log("REACHED BLOCK HEIGHT");
                                console.log(blockNumber);
                                let currentIntentions = intentionsMap.get(offset);
                                console.log(currentIntentions);
                                console.log("PERFORMING " +  currentIntentions.length + " INTENTIONS");
                                Async.each(
                                    // Iterable
                                    currentIntentions,
                                    // Action to be performed
                                    function (intention) {
                                        return BlockchainUtils.investEther(contractAddress, intention.address, intention.amount, intention.gasPrice)
                                            .then( (txHash) => {
                                                // console.log(txHash);
                                            })
                                            .catch( (err) => {
                                                console.log("ERROR");
                                                console.log(err);
                                            })
                                    },
                                    // Callback on completion
                                    function (err) {
                                        if(err) {
                                            console.log("ERROR");
                                            console.log(err)
                                        }
                                        console.log("FINISHED SENDING ALL TXs in this batch");
                                    }
                                );
                            }
                        );
                    },
                    // Callback on completion
                    function () {
                        resolve();
                    }
                );
            })
        })
        .catch( (err) => {
            console.log("Error: ");
            console.log(err);
        })
};

run();