const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const Async = require('async');

const Intention = require('./dto/intention.js');
const BlockchainUtils = require('./utils/blockchain.js');

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
    var intentionsMap;
    return fs.readFileAsync('./resources/intentions/intentions.json')
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

/*
 Async.whilst(
 function(){ return i < 5; },

 function(cb) {
 setTimeout(function() {
 console.log(i++);
 cb();
 }, 1000);
 },

 function(err) { console.log("we encountered an error", err); }
 );*/
