/* jslint node:true */
"use strict";

var Promise = require("rsvp").Promise,
	Account = require("./account"),
	Session = require("./session"),
	Logger = require("logger");
var logger = new Logger("Sessions");


function Sessions() {
	this.createSession = function( account ) {
		return new Promise( function(resolve, reject) {
			return reject({message:"unknown error"});
		});
	};
	
}