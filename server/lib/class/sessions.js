/**
 * @module Session
 */


/* jslint node:true */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger");
var logger = new Logger("Sessions");

/**
 * Sessions manager
 * 
 * @constructor
 */
function Sessions() {
	this.createSession = function( account ) {
		return new promise( function(resolve, reject) {
			logger.trace("createSession");
			return reject({message:"unknown error"});
		});
	};
	
}

module.exports = Sessions;