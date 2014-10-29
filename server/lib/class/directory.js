/**
 * @file directory.js
 * @module Directory
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

//var Person = require("./person.js");
// var Account = require("./account.js");
var promise = require("rsvp").Promise,
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
		return new promise( function(resolve, reject) {
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
	 * @todo administrator could see account informations
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param filter
	 * @returns {*}
	 */
	this.getEntries = function( pg, offset, sort, filter ) {
		logger.trace("getEntries");
		var search = {};
		if(filter) {
			try {
				search = JSON.parse(filter);
				for( var prop in search) {
					if(search.hasOwnProperty(prop)) {
						if( ["true","false"].indexOf(search[prop]) !== -1) {
							search[prop] = (search[prop]==="true"?true:false);
						}
					}
				}
			} catch(err) {
				search = {};
			}
		}
		var cursor = physioDOM.db.collection("professionals").find(search);
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
		return new promise( function(resolve, reject) {
			logger.trace("updateEntry", updatedItem);
			if (updatedItem) {
				var entry = new Professional();
				return entry.update(updatedItem)
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

	/**
	 * delete an entry of the directory
	 * 
	 * @todo remove also session of the account
	 * 
	 * @param entryID
	 * @returns {promise}
	 */
	this.deleteEntry = function(entryID) {
		function deleteProfessional( professionalID) {
			return new promise( function(resolve, reject) {
				physioDOM.db.collection("professionals").remove({ _id: professionalID}, function (err, nb) {
					if(err) {
						console.log(err);
						reject(err);
					} else {
						return resolve(nb);
					}
				});
			});
		}

		function deleteAccount( professionalID ) {
			return new promise( function(resolve, reject) {
				physioDOM.db.collection("account").remove({ "person.id": professionalID}, function (err, nb) {
					if(err) {
						console.log(err);
						reject(err);
					} else {
						return resolve(nb);
					}
				});
			});
		}
		
		return new promise( function(resolve, reject) {
			logger.trace("deleteEntry", entryID);
			var professionalID = new ObjectID(entryID);
			var professional = new Professional();
			professional.getById(professionalID)
				.then(function (professional) {
					return deleteProfessional(professionalID);
				})
				.then( function() {
					return deleteAccount(professionalID);
				})
				.then( resolve )
				.catch(reject);
		});
	};
}

module.exports = Directory;