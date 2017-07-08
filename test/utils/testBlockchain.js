const BlockchainUtils = require('../../utils/blockchain.js');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const assert = require('chai').assert;

describe('Retrieving block number tests', () => {
    it('It should be possible to retrieve the current block number', () => {
        return BlockchainUtils.getCurrentBlockNumber()
            .then((blockNumber) => {
                assert.isNotNull(blockNumber, 'The block number should not be null');
            })
            .should.be.fulfilled;
    })
});