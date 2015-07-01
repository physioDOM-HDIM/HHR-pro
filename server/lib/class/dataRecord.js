/**
 * @file dataRecord.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	Promise = require("rsvp").Promise,
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
	 * @returns {Promise}
	 */
	this.getByID = function( beneficiaryID, dataRecordID ) {
		var that = this;
		return new Promise( function(resolve, reject) {
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

	this.getAllItems = function() {
		var search = { dataRecordID: this._id };
		var that = this;
		
		var cursor = physioDOM.db.collection("dataRecordItems").find(search);
		return dbPromise.getArray(cursor)
			.then( function(items) {
				that.items = items;
			});
	};
	
	/**
	 * on resolve return a complete DataRecord for display
	 * 
	 * @returns {Promise}
	 */
	this.getComplete = function() {
		var that = this;
		var parameters;
		
		return new Promise( function( resolve, reject) {
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
	 * @returns {Promise}
	 */
	this.save = function() {
		var that = this;
		return new Promise( function(resolve, reject) {
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
	 * @returns {Promise}
	 */
	this.setup = function( beneficiaryID, dataRecordObj, professionalID ) {
		var that = this;
		
		function checkDataRecord( entry ) {
			return new Promise( function(resolve, reject) {
				logger.trace("checkDataRecord");
				var check = dataRecordSchema.validator.validate( entry, { "$ref":"/DataRecord"} );
				if( check.errors.length ) {
					return reject( { error:"bad format", detail: check.errors } );
				} else {
					return resolve(entry);
				}
			});
		}

		return new Promise( function(resolve, reject) {
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
	 * @returns {Promise}
	 */
	this.clearItems = function() {
		var that = this;
	
		return new Promise( function(resolve, reject) {
			logger.trace("clearItems");
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
	 * @returns {Promise}
	 */
	this.updateItems = function( items, professionalID ) {
		var that = this;
		function checkDataItems( entry ) {
			return new Promise( function(resolve, reject) {
				logger.trace("checkDataItems");
				var check = dataRecordSchema.validator.validate( entry, { "$ref":"/DataItems"} );
				if( check.errors.length ) {
					return reject( { error:"bad format", detail: check.errors } );
				} else {
					return resolve(entry);
				}
			});
		}
		
		return new Promise( function(resolve, reject) {
			logger.trace("updateItems");
			
			that.getAllItems()
				.then( function() {
					// console.log( "items", items );
					// console.log( "that items", that.items );
					return checkDataItems(items);
				})
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
						item.source = professionalID;
						
						dataRecordItem.setup( item )
							.then( function (recordItem) {
								if (--count === 0) {
									resolve(that);
								}
							});
					});
				})
				.catch( function(err) {
					console.log(err);
					reject(err);
				});
		});
	};
	
	this.upgradeItems = function( items, professionalID ) {
		var that = this;
		function checkDataItems( entry ) {
			return new Promise( function(resolve, reject) {
				logger.trace("checkDataItems");
				var check = dataRecordSchema.validator.validate( entry, { "$ref":"/DataItems"} );
				if( check.errors.length ) {
					return reject( { error:"bad format", detail: check.errors } );
				} else {
					return resolve(entry);
				}
			});
		}

		return new Promise( function(resolve, reject) {
			logger.trace("upgradeItems");

			that.getAllItems()
				.then( function() {
					return checkDataItems(items);
				})
				.then( function( items ) {
					var count = that.items.length;
					that.items.forEach( function( dataItem ) {
						// search in items if the current dataItem is updated or removed
						var modified = null;
						for( var i=0,l=items.length;i<l;i++) {
							if( items[i].text === dataItem.text ) {
								modified = i;
								break;
							}
						}
						if( modified !== null ) {
							var dataRecordItem = new DataRecordItem( that._id );
							console.log( "dataRecordItem", dataRecordItem);
							// check if value change
							if( items[modified].comment === undefined ) { items[modified].comment = ""; }
							// console.log(items[modified]);
							if( dataItem.value !== items[modified].value || dataItem.comment !== items[modified].comment ) {
								// value has been updated
								items[modified]._id = new ObjectID( items[modified]._id );
								items[modified].dataRecordID = new ObjectID( items[modified].dataRecordID );
								items[modified].subject = that.subject;
								items[modified].datetime = that.datetime;
								items[modified].source = professionalID;
								
								dataRecordItem.setup( items[modified] )
									.then( function( result ) {
										if (--count === 0) {
											resolve(that);
										}
									})
									.catch( function(err) {
										console.log(err.stack);
										if (--count === 0) {
											resolve(that);
										}
									});
							} else {
								console.log( dataItem._id +" no change");
								if (--count === 0) {
									resolve(that);
								}
							}
						} else {
							// the item has been deleted
							console.log( typeof dataItem._id+" "+ dataItem._id  +" is deleted");
							
							physioDOM.db.collection("dataRecordItems").remove( { _id : dataItem._id }, function( err, nb) {
								if(err) {
									throw err;
								}
								if (--count === 0) {
									resolve(that);
								}
							});
						}
					 });
				})
				.catch(reject);
		});
	};

	/**
	 * Check the datarecord and if needed set the beneficairy warning status
	 * 
	 * on fulfilled return if a warning should be raised ( boolean )
	 */
	this.checkWarningStatus = function( ) {
		logger.trace("checkWarningStatus");
		var that = this;
		var beneficiary = null;
		
		return new Promise( function( resolve, reject) {
			that.getAllItems()
				.then( function( ) {
					return physioDOM.Beneficiaries();
				})
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function( _beneficiary ) {
					beneficiary = _beneficiary;
					return beneficiary.getThreshold();
				})
				.then( function( thresholds ) {
					console.log( thresholds );
					var warning = false;
					that.items.forEach( function( item ) {
						if( thresholds[item.text] ) {
							if( thresholds[item.text].min && item.value < thresholds[item.text].min ) {
								warning = true;
							}
							if( thresholds[item.text].max && item.value > thresholds[item.text].max ) {
								warning = true;
							}
						}
					});
					resolve( warning ); 
				})
				.catch( function(err) {
					if( err.stack ) { console.log(err.stack); }
					reject(err);
				});
		});
	};
	
}

module.exports = DataRecord;