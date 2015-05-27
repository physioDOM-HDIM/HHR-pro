/**
 * @file dataRecord.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	dataRecordSchema = require("./../schema/dataRecordSchema"),
	DataRecordItem = require("./dataRecordItem.js"),
	moment = require("moment");

var logger = new Logger("DataRecord");

/**
 * Manage a beneficiary record
 *
 * @constructor
 */
function DataRecord( beneficiaryID ) {                      
	this.subject = beneficiaryID;

	/**
	 * get a DataRecord given by its dataRecordID for a given beneficiary
	 * 
	 * the beneficiaryID is given only to validate that the dataRecord belongs to the beneficiary
	 * 
	 * @param beneficiaryID
	 * @param dataRecordID
	 * @returns {promise}
	 */
	this.getByID = function( beneficiaryID, dataRecordID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getByID", beneficiaryID, dataRecordID);
			var search = { subject: beneficiaryID, _id: dataRecordID };
			
			// ensure that the datarecord is related to the beneficiary
			physioDOM.db.collection("dataRecords").findOne(search, function (err, doc) {
				if (err) {
					logger.alert("Error");
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
					
					if( that.source && that.source.toString() === beneficiaryID.toString() ) {
						logger.info("source is the beneficiary");
						physioDOM.Beneficiaries()
							.then(function (beneficiaries) {
								if (that.source) {
									return beneficiaries.getHHR(that.source);
								} else {
									return null;
								}
							})
							.then(function (beneficiary) {
								if (beneficiary) {
									that.source = beneficiary;
								}
								resolve(that);
							});
					} else {
						physioDOM.Directory()
							.then(function (directory) {
								if (that.source) {
									return directory.getEntryByID(that.source);
								} else {
									return null;
								}
							})
							.then(function (professional) {
								if (professional) {
									that.source = professional;
								}
								resolve(that);
							});
					}
				}
			});
		});
	};

	/**
	 * Get the list of measured items of the data record
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param sortDir
	 * @param filter
	 * @returns {*}
	 */
	this.getItems = function( pg, offset, sort, sortDir, filter) {
		pg = pg || 1;
		offset = offset || 100;

		var search = { dataRecordID: this._id };
		
		var cursor = physioDOM.db.collection("dataRecordItems").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.category = 1;
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	/**
	 * on resolve return a complete DataRecord for display
	 * 
	 * @returns {promise}
	 */
	this.getComplete = function() {
		var that = this;
		var parameters;
		
		return new promise( function( resolve, reject) {
			logger.trace("getComplete", that._id);
			physioDOM.Lists.getListItemsObj("parameters")
				.then( function( list ) {
					parameters = list;
					return that.getItems();
				})
				.then( function(items) {
					var obj = JSON.parse(JSON.stringify(that));
					obj.items = items;
					
					obj.items.items.forEach( function( item ) {
						if( parameters[item.text]) {
							item.category = parameters[item.text].category;
						}
					});
					resolve(obj);
				})
				.catch( function(err) {
					if(err.stack) { 
						console.log( err.stack );
					} else {
						console.log(err);
					}
					reject(err);
				});
		});
	};

	/**
	 * Save the dataRecord in the database ( collection dataRecords )
	 * 
	 * @returns {promise}
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save" );

			physioDOM.db.collection("dataRecords").save( that, function(err, result) {
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
	 * initialize the dataRecord with a full dataRecord Object with these items
	 * 
	 * @param beneficiaryID
	 * @param dataRecordObj
	 * @param professionalID
	 * @returns {promise}
	 */
	this.setup = function( beneficiaryID, dataRecordObj, professionalID ) {
		var that = this;
		
		function checkDataRecord( entry ) {
			return new promise( function(resolve, reject) {
				logger.trace("checkDataRecord");
				var check = dataRecordSchema.validator.validate( entry, { "$ref":"/DataRecord"} );
				if( check.errors.length ) {
					return reject( { error:"bad format", detail: check.errors } );
				} else {
					return resolve(entry);
				}
			});
		}

		return new promise( function(resolve, reject) {
			logger.trace("setup");
			var items;
			
			checkDataRecord(dataRecordObj)
				.then(function (dataRecord) {
					for (var prop in dataRecord) {
						if (dataRecord.hasOwnProperty(prop)) {
							switch (prop) {
								case "items":
									items = dataRecord[prop];
									break;
								default:
									that[prop] = dataRecord[prop];
							}
						}
					}
					// set the beneficiary id
					that.subject = beneficiaryID;
					that.datetime = moment().toISOString();
					if (!that.home || that.home === false) {
						if (!that.source) {
							that.source = professionalID;
						} else {
							that.source = new ObjectID(that.source);
						}
					} else {
						that.source = null;
					}
					return that.save();
				})
				.then( function( dataRecord ) {
					var count = items.length;
					items.forEach( function( item ) {
						var dataRecordItem = new DataRecordItem( that._id );
						dataRecordItem.subject = that.subject;
						dataRecordItem.datetime = that.datetime;
						dataRecordItem.setup( item )
							.then( function (recordItem) {
								if (--count === 0) {
									resolve(that);
								}
							});
					});
				})
				.catch(reject);
		});
	};

	/**
	 * Remove all items of the current dataRecord
	 * 
	 * used only by updateItems
	 * 
	 * @returns {promise}
	 */
	this.clearItems = function() {
		var that = this;
	
		return new promise( function(resolve, reject) {
			logger.trace("setup");
			that.items = [];
			physioDOM.db.collection("dataRecordItems").remove( { dataRecordID: that._id }, function( err, nb) {
				if(err) {
					throw err;
				}
				resolve(that);
			});
		});
	};

	/**
	 * update the items of the current dataRecord
	 * 
	 * in fact, it remove old all old items and create new items with the given array of items
	 * old items are removed only if the given array of items validate the schema
	 * 
	 * @param items
	 * @returns {promise}
	 */
	this.updateItems = function( items ) {
		var that = this;
		function checkDataItems( entry ) {
			return new promise( function(resolve, reject) {
				logger.trace("checkDataItems");
				var check = dataRecordSchema.validator.validate( entry, { "$ref":"/DataItems"} );
				if( check.errors.length ) {
					return reject( { error:"bad format", detail: check.errors } );
				} else {
					return resolve(entry);
				}
			});
		}
		
		return new promise( function(resolve, reject) {
			logger.trace("setup");
			checkDataItems(items)
				.then( function( items ) {
					return that.clearItems();
				})
				.then( function( obj ) {
					var count = items.length;
					items.forEach( function( item ) {
						var dataRecordItem = new DataRecordItem( that._id );
						delete item.dataRecordID;
						delete item._id;
						item.subject = that.subject;
						item.datetime = that.datetime;
						dataRecordItem.setup( item )
							.then( function (recordItem) {
								if (--count === 0) {
									resolve(that);
								}
							});
					});
				})
				.catch(reject);
		});
	};
}

module.exports = DataRecord;