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

            const q = Async.queue(function(task, callback) {
                return BlockchainUtils.investEther(contractAddress, task.address, task.amount, task.gasPrice)
                    .then( () => {
                        callback();
                    })
            }, 2);

            Async.each(blockNumbers,
                function (blockNumber) {
                    // BlockNumber is now treated as an offset
                    blockNumber = startBlock + blockNumber;
                    Async.until(
                        function () {
                            return currentBlockNumber >= blockNumber;
                        },
                        function (cb) {
                            return BlockchainUtils.getCurrentBlockNumber()
                                .then((blockNumber) => {
                                    currentBlockNumber = blockNumber;
                                    cb();
                                })
                        },
                        () => {
                            console.log("REACHED BLOCK HEIGHT");
                            console.log(blockNumber);
                            let currentIntentions = intentionsMap.get(blockNumber);
                            console.log("PERFORMING " +  currentIntentions.length + " INTENTIONS");
                            for(let intention of currentIntentions) {
                                q.push(intention, function(err) {
                                    console.log('finished processing foo');
                                });
                            }
                        }
                    );
                },
                function () {
                    console.log("DONE");
                }
            );

            /*console.log(blockNumbers.length);
             for(let blockNumber of blockNumbers) {

             }*/
        })
        .catch( (err) => {
            console.log("Error: ");
            console.log(err);
        })
};

run();