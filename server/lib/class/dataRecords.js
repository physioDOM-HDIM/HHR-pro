/**
 * @file dataRecords.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	DataRecord = require("./dataRecord");

var logger = new Logger("DataRecords");

function DataRecords( beneficiaryID ) {
	this.beneficiaryID = beneficiaryID;
	
	this.getList = function(pg, offset, sort, sortDir, filter) {
		pg = pg || 1;
		offset = offset || 20;
		
		var search = { subject: this.beneficiaryID };
		
		var cursor = physioDOM.db.collection("dataRecords").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.datetime = 1;
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	/**
	 * Get a dataRecord by its ID
	 * 
	 * @param dataRecordID
	 * @returns {*}
	 */
	this.getByID = function( dataRecordID ) {
		logger.trace("getByID", dataRecordID );
		var datarecord = new DataRecord();
		return datarecord.getByID( this.beneficiaryID, new ObjectID( dataRecordID ));
	};
}

module.exports = DataRecords;