/* jslint node:true */
"use strict";

/**
Constructor Person
*/
function Person( ) {
	
	this.setup = function( obj ) {
		for (var prop in this) {
			if (obj.hasOwnProperty(prop)) {
				this[prop] = obj[prop];
			}
		}
	};
}

Person.prototype = {
	lastname   : null,
	firstname  : null,
	title      : null,
	role       : null,
	profession : null,

	get name() {
		return this.lastname + " " + this.firstname;
	},

	getAddresses : function() {
		
	},
	
	getPhones : function() {
		
	}
};

module.exports = Person;