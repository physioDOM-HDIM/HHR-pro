/**
 * @file questionnaire.js
 * @module Questionnaire
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	questionnaireSchema = require("./../schema/questionnaireSchema");

var logger = new Logger("Questionnaire");

/**
 * Manage a questionnaire record
 * 
 * @constructor
 */
function Questionnaire( ) {

	/**
	 * save the beneficiary in the database
	 * 
	 * the promise return the beneficiary object completed with the `_id` for a new record
	 * 
	 * @returns {promise}
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("-> save" );
			
			physioDOM.db.collection("questionnaires").save( that, function(err, result) {
				if(err) { 
					throw err; 
				}
				if( isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};

	/**
	 * Check that there's no questionnaire already exists with the same
	 *  name
	 *  
	 * @todo set a regexp case insensitive for the name
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkUniq( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkUniq");

			var filter = { name: entry.name };
			if( entry._id ) {
				filter._id = { "$ne": new ObjectID(entry._id) };
			}
			physioDOM.db.collection("questionnaires").count( filter , function(err,nb) {
				if(err) {
					logger.error(err);
					reject(err);
				}
				if(nb > 0) {
					logger.warning("duplicate");
					reject({error:"duplicate"});
				} else {
					resolve( entry );
				}
			});
		});
	}

	/**
	 * Check the schema of a questionnaire record
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkSchema( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = questionnaireSchema.validator.validate( entry, { "$ref":"/Questionnaire"} );
			if( check.errors.length ) {
				// console.log(JSON.stringify(check.errors,null,4));
				return reject( { error:"bad format", detail: check.errors } );
			} else {
				return resolve(entry);
			}
		});
	}

	/**
	 * initialize a questionnaire with the object `newEntry`
	 * 
	 * the promise return on success the questionnaire record
	 * 
	 * @param newEntry
	 * @returns {promise}
	 */
	this.setup = function( newEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("setup");
			checkSchema(newEntry)
				.then(checkUniq)
				.then(function (entry) {
					for (var key in newEntry) {
						if (newEntry.hasOwnProperty(key)) {
							that[key] = newEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	/**
	 * Update the questionnaire
	 * 
	 * `updatedEntry` is a full object that replace the old one
	 * 
	 * @param updatedEntry
	 * @returns {promise}
	 */
	this.update = function( updatedEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("update");
			if( that._id.toString() !== updatedEntry._id ) {
				logger.warning("not same questionnaire");
				throw { code:405, message:"not same questionnaire"};
			}
			updatedEntry._id = that._id;
			checkSchema(updatedEntry)
				.then(function (updatedEntry) {
					logger.debug("schema is valid");
					for (var key in updatedEntry) {
						if (key !== "_id" && updatedEntry.hasOwnProperty(key)) {
							that[key] = updatedEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	/**
	 * Get a questionnaire in the database known by its ID
	 * 
	 * on success the promise returns the questionnaire record,
	 * else return an error ( code 404 )
	 * 
	 * @param questionnaireID
	 * @returns {promise}
	 */
	this.getById = function( questionnaireID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getById", questionnaireID);
			physioDOM.db.collection("questionnaires").findOne({ _id: questionnaireID }, function (err, doc) {
				if (err) {
					logger.alert("Database Error");
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
	 *
	 * @param name
	 * @returns {*|$$rsvp$promise$$default|RSVP.Promise}
	 */
	this.getByRef = function( name ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getByRef", name);
			physioDOM.db.collection("questionnaires").findOne({ name: name }, function (err, doc) {
				if (err) {
					logger.alert("Database Error");
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
}

module.exports = Questionnaire;