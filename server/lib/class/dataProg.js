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

}

module.exports = DataProg;