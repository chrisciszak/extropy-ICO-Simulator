const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const Async = require('async');
const Web3 = require('web3');

var web3 = undefined;

// Private functions
var initWeb3 = function () {
    if (web3 === undefined) {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
};

var createNewContractInstance = function (name, startBlock, endBlock, fromAccount) {
    let instance = undefined;
    let contractWrapper = undefined;
    initWeb3();

    return fs.readFileAsync('./contracts/contract_definitions.json')
        .then( (contracts) => {
            let contractsList = JSON.parse(contracts);
            let icoDetails = contractsList[name];
            contractWrapper = web3.eth.contract(icoDetails.abi);

            if(fromAccount === undefined) {
                fromAccount = contractsList['DeployAccount'].address;
            }

            return contractWrapper.new(startBlock, endBlock, web3.toWei(icoDetails.price, 'ether'), "0x0", {data: icoDetails.bytecode, from: fromAccount, gas: 4700000});
        })
        .then( (txReceipt) => {
            return new Promise( (resolve, reject) => {
                Async.until(
                    function () {
                        return txReceipt.address !== undefined;
                    },
                    function (cb) {
                        setTimeout(cb, 500);
                    },
                    () => {
                        resolve(txReceipt);
                    }
                );
            });
        })
        .then( (_instance) => {
            console.log("Contract Address: " + _instance.address);
            instance = _instance;
            //return instance.createTokenContract();
            return { address : "0x0"};
        })
        .then( (token) => {
            console.log("Token Address: " + token.address);
            console.log(token);
            return {contract : instance.address, token : token.address};
        });
};

module.exports = {
    createNewContractInstance: createNewContractInstance
}


