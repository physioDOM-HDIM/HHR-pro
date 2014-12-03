/**
 * @file dataRecord.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID;

var logger = new Logger("DataRecord");

/**
 * Manage a beneficiary record
 *
 * @constructor
 */
function DataRecord() {
	
	this.getByID = function( beneficiaryID, dataRecordID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getByID", dataRecordID);
			var search = { subject: beneficiaryID, _id: dataRecordID };

			console.log( search );
			// ensure that the datarecord is related to the beneficiary
			physioDOM.db.collection("dataRecords").findOne(search, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"not found"});
				} else {
					
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					resolve(that);
				}
			});
		});
	};

	/**
	 * Get the list of measured items of the data record
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param sortDir
	 * @param filter
	 * @returns {*}
	 */
	this.getItems = function( pg, offset, sort, sortDir, filter) {
		pg = pg || 1;
		offset = offset || 20;

		var search = { };

		var cursor = physioDOM.db.collection("dataRecordItems").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.category = 1;
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};
}

module.exports = DataRecord;