/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

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