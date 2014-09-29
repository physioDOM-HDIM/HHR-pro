var Person = require("./person.js");

function Account( physioDOM, obj ) {
	var _physioDOM = physioDOM;
	for( var prop in this ) {
		if( obj[prop] ) this[prop] = obj[prop];
	}
}

Account.prototype = {
	_id       : null,
	login     : null,
	passwd    : null,
	tmpPasswd : null,
	role      : null,
	person    : { id:null, type:null }
};

module.exports = Account;