/**
 * @file dataProg.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var dbPromise = require("./database.js"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID;

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

	/**
	 * Remove from database a dataProgItem object defined by the given identifier
	 * 
	 * on succeed, the promise return true, otherwise reject with a error message.
	 * 
	 * @param dataProgItemID {string}
	 * @returns {Promise}
	 */
	this.remove = function( dataProgItemID ) {
		var that = this;
		
		return new promise( function(resolve, reject) {
			logger.trace("remove", dataProgItemID );
			
			if( !that.subject ) {
				reject( { err:500, message:"no beneficiaryID defined"});
			} else {
				var search = { subject: that.subject, _id: new ObjectID(dataProgItemID) };
				console.log( search );
				physioDOM.db.collection("measurePlan").remove( search, function(err, nb) {
					if(err) {
						reject(err);
					} else {
						if( nb ) {
							resolve( true );
						} else {
							reject( { err:404, message: "no item found"});
						}
					}
				});
			}
		});
	};
}

module.exports = DataProg;