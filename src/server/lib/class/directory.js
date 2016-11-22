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
 * @file directory.js
 * @module Directory
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

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
	this.createEntry = function( newEntry, professionalID ) {
		return new Promise( function(resolve, reject) {
			logger.trace("createEntry", newEntry);
			if( newEntry ) {
				var entry = new Professional( );
				return entry.init( newEntry, professionalID )
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
	 * Entries are arranged alphabetically by family name ( by default )
	 * 
	 * filter requests are case-insensitive, filters are JSON like :
	 *  { fieldName : value }
	 * 
	 * @param pg {integer} page number
	 * @param offset {integer} number of elements by page
	 * @param sort {string} name of the field to sort
	 * @param sortDir (-1|1) sort direction -1:descending 1:ascending
	 * @param filter {string} json object containing the filter request 
	 * @returns {*}
	 */
	this.getEntries = function( pg, offset, sort, sortDir, filter ) {
		logger.trace("getEntries");
		var search = {};
		if(filter) {
			try {
				var tmp = JSON.parse(filter);
				for( var prop in tmp) {
					if(tmp.hasOwnProperty(prop)) {
						switch(prop) {
							case "name":
								search["name.family"] = new RegExp("^"+tmp.name,"i");
								break;
							case "perimeter":
								if( tmp.perimeter !== 'NONE') {
									search.perimeter = tmp.perimeter;
								}
								break;
							default:
								if( ["true","false"].indexOf(tmp[prop]) !== -1) {
									search[prop] = (tmp[prop]==="true"?true:false);
								}
						}
					}
				}
			} catch(err) {
				search = { };
			}
		}
		var cursor = physioDOM.db.collection("professionals").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort = { "name.family":1};
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	this.getList = function() {
		logger.trace("getList");
		return new Promise( function(resolve, reject) {
			physioDOM.db.collection("professionals").find({}).sort({ "name.family":1}).toArray(function(err, list) {
				resolve(list);
			});
		});
	};

	/**
	 * get an entry given by its id
	 * 
	 * @param entryID
	 * @returns {*}
	 */
	this.getEntryByID = function( entryID ) {
		logger.trace("getEntryByID", entryID);
		return new Promise( function(resolve, reject) {
			if( !entryID ) {
				reject();
			} else {
				var professionalID = new ObjectID(entryID);
				(new Professional()).getById(professionalID)
					.then(resolve)
					.catch(reject);
			}
		});
	};

	/**
	 * get an entry given by its id
	 *
	 * @param entryID
	 * @returns {*}
	 */
	this.getAdminEntryByID = function( entryID ) {
		logger.trace("getEntryByID", entryID);
		var professionalID = new ObjectID(entryID);
		return (new Professional()).getAdminById(professionalID);
	};

	/**
	 * update an entry with the `updatedItem` object
	 *
	 * @param updatedItem
	 * @returns {Promise}
	 */
	this.updateEntry = function( updatedItem ) {
		return new Promise( function(resolve, reject) {
			logger.trace("updateEntry", updatedItem);
			if (updatedItem) {
				var entry = new Professional();
				return entry.update(updatedItem)
					.then(resolve)
					.catch(function (err) {
						logger.alert("error ", err);
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
	 * @returns {Promise}
	 */
	this.deleteEntry = function(entryID) {
		function deleteProfessional( professionalID) {
			return new Promise( function(resolve, reject) {

				physioDOM.db.collection("beneficiaries").update( { 'professionals.professionalID': professionalID.toString() }, { '$pull': { professionals : { professionalID: professionalID.toString() } } }, { multi:true }, function(err) {
					if(err) {
						console.log(err);
					} else {
						physioDOM.db.collection("professionals").remove({ _id: professionalID}, function (err, nb) {
							if(err) {
								console.log(err);
								reject(err);
							} else {
								return resolve(nb);
							}
						});
					}
				});
			});
		}

		function deleteAccount( professionalID ) {
			return new Promise( function(resolve, reject) {
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
		
		return new Promise( function(resolve, reject) {
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