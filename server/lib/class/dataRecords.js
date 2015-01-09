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
		logger.debug("search", search);
		
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
		
		return dbPromise.getList(cursor, pg, offset)
			.then( function( list ) {
				var promises = list.items.map( function( item ) {
					return physioDOM.Directory()
						.then( function( directory ) {
							if( item.source ) {
								return directory.getEntryByID( item.source );
							} else {
								return null;
							}
						})
						.then( function( professional ) {
							if( professional ) {
								item.source = professional;
							}
							return item;
						})
						.catch( function(err) {
							console.log("err", err);
							return item;
						});
				});
				
				return RSVP.all( promises )
					.then( function( datarecords ) {
						list.items = datarecords;
						return list;
					})
					.catch( function(err) {
						console.log(err);
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