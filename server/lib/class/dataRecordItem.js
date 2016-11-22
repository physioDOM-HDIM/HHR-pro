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
 * @file dataRecordItem.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger");

var logger = new Logger("DataRecordItem");

function dataRecordItem( dataRecordID ) {
	this.dataRecordID = dataRecordID;
	this.comment = "";
	
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save" );

			physioDOM.db.collection("dataRecordItems").save( that, function(err, result) {
				if(err) {
					throw err;
				}
				if( isNaN(result)) {
					that._id = result._id;
				}
				
				resolve(that);
			});
		});
	};
	
	this.setup = function( dataItem ) {
		logger.trace("setup");
		
		for (var prop in dataItem) {
			if (dataItem.hasOwnProperty(prop)) {
				this[prop] = dataItem[prop];
			}
		}
		return this.save();
	};
}

module.exports = dataRecordItem;