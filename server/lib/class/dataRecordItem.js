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