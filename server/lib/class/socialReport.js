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
 * @file socialReport.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	promise = RSVP.Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var logger = new Logger("socialReport");

/**
 * Manage a message to home for the given beneficiary
 *
 * @constructor
 */
function SocialReports( beneficiaryID ) {
	/**
	 * the beneficiary ID
	 */
	this.subject = beneficiaryID;
	
	this.setReport = function( obj, professional ) {
		logger.trace('setReport');
		var report = JSON.parse( obj );
		report.source = professional;
		report.subject = this.subject;
		
		return new promise( function(resolve) {
			physioDOM.db.collection("socialReport").save( report, function( err, result ) {
				if(err) { throw err; }
				resolve( result );
			});
		});
	};
	
	this.getLast = function() {
		logger.trace('getLast');
		var search = { subject: this.subject };
		var that = this;
		
		return new promise( function(resolve, reject) {
			physioDOM.db.collection("socialReport").find(search).sort({datetime: -1}).limit(1).toArray(function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				logger.debug( doc.length );
				if ( !doc[0]) {
					var report = {
						reports: {},
						subject: that.subject 
					};
					resolve(report);
				} else {
					resolve(doc[0]);
				}
			});
		});
	};
	
	this.getHistory = function( pg, offset ) {
		
	};
}

module.exports = SocialReports;