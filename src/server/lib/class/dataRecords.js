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
 * @file dataRecords.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment"),
	DataRecord = require("./dataRecord");

var logger = new Logger("DataRecords");


function DataRecords( beneficiaryID ) {
	this.beneficiaryID = beneficiaryID;

	/**
	 * Get a list object of dataRecords
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param sortDir
	 * @param filter
	 * @returns {*|Promise}
	 */
	this.getList = function(pg, offset, sort, sortDir, filter) {
		pg = pg || 1;
		offset = offset || 20;
		
		var search = { subject: this.beneficiaryID };
		if( filter ) {
			try {
				var filter = JSON.parse(filter);
				if (filter.startDate) {
					search.datetime = {"$gte": filter.startDate};
				}
				if (filter.endDate) {
					var endDate =  moment(filter.endDate, "YYYY-MM-DD").add(1,'day').toISOString();
					if( search.datetime ) {
						search["$and"] = [ { datetime:search.datetime }, { datetime:{"$lte": endDate}}];
						delete search.datetime;
					} else {
						search.datetime = {"$lte": filter.endDate};
					}
				}
				if( filter.source ) {
					search.source = new ObjectID(filter.source);
				}
			} catch(err) {
				logger.warning("bad filter format");
			}
		}
		
		var cursor = physioDOM.db.collection("dataRecords").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		}
		// data records are always sorted by descending datetime unless otherwise
		if (sort !== "datetime") {
			cursorSort.datetime = -1;
		}
		cursor = cursor.sort( cursorSort );
		var that = this;
		return dbPromise.getList(cursor, pg, offset)
			.then( function( list ) {
				var promises = list.items.map( function( item ) {
					if( item.source && item.source.toString() === that.beneficiaryID.toString() ) {
						item.self = true;
						return physioDOM.Beneficiaries()
							.then(function (Beneficiaries) {
								if (item.source) {
									return Beneficiaries.getHHR(item.source);
								} else {
									return null;
								}
							})
							.then(function (beneficiary) {
								if (beneficiary) {
									item.source = beneficiary;
								}
								return item;
							})
							.catch(function (err) {
								logger.warning("getList error", err);
								return item;
							});
					} else {
						item.self = false;
						return physioDOM.Directory()
							.then(function (directory) {
								if (item.source) {
									return directory.getEntryByID(item.source);
								} else {
									return null;
								}
							})
							.then(function (professional) {
								if (professional) {
									item.source = professional;
								}
								return item;
							})
							.catch(function (err) {
								logger.warning("getList error", err);
								return item;
							});
					}
				});
				
				return RSVP.all( promises )
					.then( function( datarecords ) {
						list.items = datarecords;
						return list;
					})
					.catch( function(err) {
						logger.warning("getList error",err);
						return list;
					});
			});
	};

	/**
	 * Get a dataRecord by its ID
	 * 
	 * @param dataRecordID
	 * @returns {*}
	 */
	this.getByID = function( dataRecordID ) {
		logger.trace("getByID", dataRecordID );
		var datarecord = new DataRecord();
		return datarecord.getByID( this.beneficiaryID, new ObjectID( dataRecordID ));
	};
}

module.exports = DataRecords;