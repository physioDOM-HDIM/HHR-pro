var Person = require("./person.js");
var Account = require("./account.js");

function Professional( obj ) {
	Person.call(this, obj);
}

Professional.prototype = Object.create( Person.prototype, { });

Professional.prototype.constructor = Professional;

module.exports = Professional;