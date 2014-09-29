var should = require("should"),
    Account = require("./account.js");

function Beneficiary( obj ) {
	Account.call( this, obj );
	for( var prop in this ) {
		if( obj[prop] ) this[prop] = obj[prop];
	}
}

Beneficiary.prototype = Object.create( Account.prototype, {
	birthdate     : { value:null, enumerable: true, configurable: true,writable: true },
	socialID      : { value:null, enumerable: true, configurable: true,writable: true },
	referring     : { value:null, enumerable: true, configurable: true,writable: true },
	physioDOMBox  : { value:null, enumerable: true, configurable: true,writable: true },
	details : { value: {
		maritalStatus: null,
		disability: {
			type:null,
			level:0
		},
		lifeCondtion: null,
		profession:null
	}, enumerable: true, configurable: true,writable: true },
	perimeter     : { value:null, enumerable: true, configurable: true,writable: true },
	
	check: function() {
		return true;
	},
	
	getEvents : function() {
		
	},
	
	save : function() {
		
	},
	
	getHealthServices : function() {
		
	},
	
	getSocialServices : function() {
		
	},
	
	getDietaryServices : function() {
		
	},
	
	getProfessionals : function() {
		
	},
	
	getContacts : function() {
		
	},
	
	getMessages : function() {
		
	},
	
	getIPMessages : function() {
		
	}
})

Beneficiary.prototype.constructor = Beneficiary;

module.exports = Beneficiary;