/**
 * @file directory.js
 * @module Directory
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

//var Person = require("./person.js");
// var Account = require("./account.js");
var Promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Professional = require("./professional");

var logger = new Logger("Directory");

/**
 * Directory
 * 
 * This class allows to manage the professionals directory
 * 
 * @constructor
 */
function Directory( ) {
	/**
	 * Create a new entry in the directory
	 * 
	 * @param newEntry
	 * @returns {Promise}
	 */
	this.createEntry = function( newEntry ) {
		// check the Entry format
		
		// if entry is valid create it
		// and send it
		
		// else reject
		return new Promise( function(resolve, reject) {
			logger.trace("createEntry", newEntry);
			if( newEntry ) {
				var entry = new Professional( );
				return entry.init( newEntry)
					.then( resolve )
					.catch( function(err) {
						logger.alert("error ", err);
						console.log(err);
						reject(err);
					} );
			} else {
				return reject("Error no entry");
			}
		});
	};

	/**
	 * Get the list of entries per page
	 * 
	 * @TODO administrator could see account informations
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param filter
	 * @returns {*}
	 */
	this.getEntries = function( pg, offset, sort, filter ) {
		logger.trace("getEntries");
		var cursor = physioDOM.db.collection("professionals").find();
		if(sort) {
			var cursorSort = {};
			cursorSort[sort] = 1;
			cursor = cursor.sort( cursorSort );
		}
		return dbPromise.getList(cursor, pg, offset);
	};

	/**
	 * get an entry given by its id
	 * 
	 * @param entryID
	 * @returns {*}
	 */
	this.getEntryByID = function( entryID ) {
		logger.trace("getEntryByID", entryID);
		var professionalID = new ObjectID(entryID);
		return (new Professional()).getById(professionalID);
	};
	
	this.updateEntry = function( updatedItem ) {
		// the updatedItem must check the schema
		// the updatedItem must have the same ID
		return new Promise( function(resolve, reject) {
			logger.trace("updateEntry", updatedItem);
			if (updatedItem) {
				var entry = new Professional();
				return entry.update(newEntry)
					.then(resolve)
					.catch(function (err) {
						logger.alert("error ", err);
						console.log(err);
						reject(err);
					});
			} else {
				return reject("Error no entry");
			}
		});
	};
	
	this.deleteEntry = function(entryID) {
		return new Promise( function(resolve, reject) {
			logger.trace("deleteEntry", entryID);
			var professionalID = new ObjectID(entryID);
			var professional = new Professional();
			professional.getById(professionalID)
				.then(function (professional) {
					logger.debug("delete 1");
					// remove the entry in the database
					physioDOM.db.collection("professionals").remove({ _id: professionalID}, function (err, nb) {
						logger.debug("delete 2", err, nb);
						if(err) {
							console.log(err);
							reject(err);
						} else {
							return resolve(nb);
						}
					});
					// remove account associated with the professional
					// remove sessions associated to the account
				})
				.catch(reject);
		});
	};
}

module.exports = Directory;