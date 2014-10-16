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

function Directory( ) {
	
	this.createEntry = function( newEntry ) {
		// check the Entry format
		
		// if entry is valid create it
		// and send it
		
		// else reject
		return new Promise( function(resolve, reject) {
			var directorySchema = require("./directorySchema");
			logger.trace("createEntry", newEntry);
			if( newEntry ) {
				var check = directorySchema.validator.validate(newEntry, { "$ref":"/Professional"} );
				if( check.errors.length ) {
					return reject( JSON.stringify(check.errors) );
				}
				return resolve(newEntry);
			} else {
				return reject("Error no entry");
			}
		});
	};
	
	this.getEntries = function( pg, offset, sort, filter ) {
		var cursor = physioDOM.db.collection("professionals").find();
		if(sort) {
			var cursorSort = {};
			cursorSort[sort] = 1;
			cursor = cursor.sort( cursorSort );
		}
		return dbPromise.getList(cursor, pg, offset);
	};
	
	this.getEntryByID = function( entryID ) {
		logger.trace("getEntryByID", entryID);
		var professionalID = new ObjectID(entryID);
		logger.debug( "_id :" , professionalID);
		return (new Professional()).getById(professionalID);
	};
}

module.exports = Directory;