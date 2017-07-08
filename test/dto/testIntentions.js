const Intention = require('../../dto/intention.js');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

const assert = require('chai').assert;

describe('Verify marshalling intention data from a file', () => {

    it('should possible to read intentions from a file and marshal them to intention objects', () => {
        return fs.readFileAsync('./test/resources/intentions/intentions1.json')
            .then((data) => {
                const intentions = Intention.marshalIntentions(data);
                assert.isNotNull(intentions, "Expected that the file would contain intentions.");
                assert.equal(2, intentions.length, "Expected that there would be two intentions in the file.");
                const smallInvestor = intentions[0];
                assert.equal(smallInvestor.address, "0x1234");
                assert.equal(smallInvestor.amount, 10000);
                assert.equal(smallInvestor.gasPrice, 10);
                assert.equal(smallInvestor.blockNumber, 1);

                const largeInvestor = intentions[1];
                assert.equal(largeInvestor.address, "0x5678");
                assert.equal(largeInvestor.amount, 90000000);
                assert.equal(largeInvestor.gasPrice, 2000);
                assert.equal(largeInvestor.blockNumber, 1);
            });
    });

});