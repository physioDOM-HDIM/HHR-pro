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
 * @file dataProgItem.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	dataProgSchema = require("./../schema/dataProgSchema"),
	moment = require("moment"),
	Logger = require("logger");

var logger = new Logger("DataProgItem");

/**
 * represents a "dataProgItem"
 * 
 * the programming of a measurement
 * the values are saved in the "measurePlan"
 * 
 * @constructor
 */
function DataProgItem( beneficiaryID ) {
	this.subject = beneficiaryID;

	/**
	 * create an object with the `prescription` object given
	 * 
	 * the object must check the dataProgItem schema
	 * 
	 * the promise, if succeed, send the object as saved in database.
	 * 
	 * @param prescription
	 * @returns {promise}
	 */
	this.setup = function( prescription, source ) {
		var that = this;

		return new promise( function(resolve, reject) {
			logger.trace("setup");

			// check format of the prescription
			// save the prescription
			// return the saved prescription
			checkSchema(prescription)
				.then(function (_prescription) {
					console.log( "checked")
					_prescription.subject = that.subject;
					for (var prop in _prescription) {
						if (_prescription.hasOwnProperty(prop) && prop !== "subject") {
							that[prop] = _prescription[prop];
						}
					}
					that.source = source;
					that.datetime = moment().toISOString();
					return that.save();
				})
				.then( resolve )
				.catch( reject );
		});
	};

	/**
	 * Check that the entry is a valid dataProgItem
	 *
	 * @param entry
	 * @returns {promise}
	 */
	function checkSchema( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = dataProgSchema.validator.validate( entry, { "$ref":"/dataProgItem"} );
			if( check.errors.length ) {
				return reject( {error:"bad format", detail: check.errors} );
			} else {
				// check that the ref is a correct reference of the category
				var listName = entry.category;
				if( ["General","HDIM"].indexOf(listName) !== -1) {
					listName = "parameters";
				}
				physioDOM.Lists.getList(listName)
					.then( function( list ) {
						list.getItem(entry.ref)
							.then( function( item ) {
								if( listName === "parameters" && entry.category !== item.category ) {
									reject({err: 405, message: entry.ref+" is not in the "+listName+" ("+item.category+") list"});
								} else {
									resolve(entry);
								}
							})
							.catch( function(err) {
								throw {err: 405, message: entry.ref+" is not in the "+listName+" list"};
							});
					})
					.catch( reject );
			}
		});
	}

	/**
	 * Save the object in the measurePlan collection
	 * 
	 * it remove old entries for the reference parameter, and save the new one
	 * 
	 * the promise if succeed return the recorded object
	 * 
	 * @returns {promise}
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save" );
			
			// remove old one
			// then save the new one
			physioDOM.db.collection("measurePlan").remove( { ref: that.ref, subject: that.subject }, function(err, nb) {
				if(err) {
					reject(err);
				} else {
					physioDOM.db.collection("measurePlan").save(that, function (err, result) {
						if (err) {
							throw err;
						}
						if (isNaN(result)) {
							that._id = result._id;
						}
						resolve(that);
					});
				}
			});
		});
	};
}

module.exports = DataProgItem;