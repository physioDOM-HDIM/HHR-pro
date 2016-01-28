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
			physioDOM.db.collection("socialReport").find(search).sort({datetime: 1}).limit(1).toArray(function (err, doc) {
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