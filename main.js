const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const Async = require('async');
var program = require('commander');

const Intention = require('./dto/intention.js');
const BlockchainUtils = require('./utils/blockchain.js');
const ContractFactory = require('./utils/contractFactory.js');

var currentBlockNumber = 0;

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
    return ContractFactory.createNewContractInstance()
        .then( (contractInstanceDetails) => {
            return fs.readFileAsync('./resources/intentions/intentions.json')
        })
        .then((intentionsData) => {
            let intentions = Intention.marshalIntentions(intentionsData);
            intentionsMap = gatherIntentionsPerBlock(intentions);
            let blockNumbers = intentionsMap.keys();

            Async.each(blockNumbers,
                function (blockNumber) {
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
                            console.log(blockNumber)
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
};

run();