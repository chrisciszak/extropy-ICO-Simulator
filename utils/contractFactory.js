const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

const Web3 = require('web3');

var web3 = undefined;

// Private functions
var initWeb3 = function () {
    if (web3 === undefined) {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
};

var createNewContractInstance = function (name, startBlock, endBlock, price, fromAccount) {
    let instance = undefined;
    let contractWrapper = undefined;
    return initWeb3()
        .then( () => {
            return fs.readFileAsync('./contracts/contract_definitions.json')
        })
        .then( (contracts) => {
            let contractsList = JSON.parse(contracts);
            contractWrapper = web3.eth.contract(contractsList.name.abi);

            return contractWrapper.new(startBlock, endBlock, price, {data: contractsList.name.bytecode, from: fromAccount, gas: 1000000});
        })
        .then( (txReceipt) => {
            console.log("THE TX RECEIPT");
            console.log(txData);
            return web3.eth.getTransactionReceipt(txReceipt);
        })
        .then( (txData) => {
            console.log("THE TX DATA");
            console.log(txData);

            return contractWrapper.at(txData.contractAddress);
        })
        .then( (_instance) => {
            console.log("THE INSTANCE");
            console.log(_instance);
            instance = _instance;
            return instance.createTokenContract();
        })
        .then( (token) => {
            console.log("THE TOKEN");
            console.log(token);
        })
};

module.exports = {
    getContractInstance: createNewContractInstance
}


