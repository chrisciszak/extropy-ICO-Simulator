const S = require('string');

// Public
function Intention(_address, _amount, _gasPrice, _blockNumber) {
    this.address = _address;
    this.amount = _amount;
    this.gasPrice = _gasPrice;
    this.blockNumber = _blockNumber;
}


Intention.marshalIntentions = function(data) {
    if(S(data).isEmpty()) {
        throw new TypeError("Unable to marshal empty or blank data");
    }

    var intentionsList = JSON.parse(data);

    var intentions = [];

    intentionsList.forEach( (intention) => {
        var tmpIntention = new Intention(intention.address, intention.amount, intention.gasPrice, intention.blockNumber);
        intentions.push(tmpIntention);
    });

    return intentions;
}

module.exports = Intention;