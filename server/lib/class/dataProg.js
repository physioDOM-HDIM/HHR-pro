/**
 * @file dataProg.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	dataRecordSchema = require("./../schema/dataRecordSchema"),
	DataRecordItem = require("./dataRecordItem.js"),
	moment = require("moment");

var logger = new Logger("DataProg");

/**
 * Manage a beneficiary data programmation
 *
 * @constructor
 */
function DataProg( beneficiaryID ) {
	this.subject = beneficiaryID;

	this.getCategory = function( category ) {
		if( ["General","HDIM","symptom","questionnaire"].indexOf( category ) === -1 ) {
			throw {code: 405, message: "unknown category"};
		}

		var cursor = physioDOM.db.collection("measurePlan").find( { category: category, subject: this.subject } );
		return dbPromise.getArray(cursor);
	};
}

module.exports = DataProg;