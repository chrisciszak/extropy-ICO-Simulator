const Web3 = require('web3');

var web3 = undefined;

// Private functions
var initWeb3 = function () {
    if (web3 === undefined) {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
};

// Public functions
var getCurrentBlockNumber = function () {
    initWeb3();

    return new Promise((resolve, reject) => {
        web3.eth.getBlockNumber((error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};

var hasBlockHeightBeenReached = function (blockNumber) {
    if(blockNumber === undefined || blockNumber < 0) {
        return Promise.resolve(false);
    }

    return getCurrentBlockNumber()
        .then( (currentBlockNumber) => {
            return Promise.resolve(currentBlockNumber >= blockNumber);
        });
};

var investEther = function (contractInstance, fromAddress, amount, gasPrice) {
    initWeb3();
    return web3.eth.sendTransaction({to: contractInstance.address, from: fromAddress, value: amount, gasPrice : gasPrice});
};

module.exports = {
    getCurrentBlockNumber: getCurrentBlockNumber,
    hasBlockHeightBeenReached: hasBlockHeightBeenReached,
    investEther: investEther
}