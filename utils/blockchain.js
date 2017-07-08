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

var investEther = function () {
    initWeb3();


};

module.exports = {
    getCurrentBlockNumber: getCurrentBlockNumber,
    investEther: investEther
}