/**
 * @file service.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	dbPromise = require("./database.js"),
	serviceSchema = require("./../schema/serviceSchema"),
	moment = require("moment"),
	Logger = require("logger");

var logger = new Logger("Services");

function Services( beneficiaryID ) {
	this.beneficiaryID = beneficiaryID;
}

Services.prototype.getServices = function( category ) {
	logger.trace("getServices", category);

	var search = {
		category: category,
		beneficiaryID : this.beneficiaryID
	};

	var cursor = physioDOM.db.collection("services").find(search);
	// cursor = cursor.sort( {name:1} );
	return dbPromise.getList(cursor, 1, 1000);
};

module.exports = Services;