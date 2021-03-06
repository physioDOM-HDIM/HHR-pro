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
				// console.log( search );
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