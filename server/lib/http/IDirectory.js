/* jslint node:true */
"use strict";

/**
 * IDirectory
 * 
 * treat http request for the directory
 * @type {exports}
 */
	
var dbPromise = require("../class/database.js"),
	Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	Logger = require("logger");

var logger = new Logger("IDirectory");

var IDirectory = {
	/**
	 * retrieve directory entry and send it as json object
	 * @param req
	 * @param res
	 * @param next
	 */
	getEntries: function( req, res, next ) {
		logger.trace("getEntries");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 10;
		var sort = req.params.sort;

		physioDOM.Directory()
			.then( function(directory) {
				return directory.getEntries(pg, offset, sort);
			})
			.then( function(list) {
				res.send(list);
				next();
			})
			.catch( function(err) {
				logger.error(err);
			});
	},
	/**
	 * Create a new entry in the directory
	 * the new entry to be create is given in the body of a POST request in JSON
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	createEntry: function(req, res, next ) {
		logger.trace("createEntry");

		physioDOM.Directory()
			.then( function(directory) {
				if(!req.body) {
					throw( {"message":"entry is empty"});
				}
				var user = JSON.parse( req.body.toString() );
				return directory.createEntry(user);
			})
			.then( function(entry) {
				res.send(entry);
				next();
			})
			.catch( function(err) {
				res.send(400, err);
				next(false);
			});
	},
	
	getEntry: function(req, res, next) {
		physioDOM.Directory()
			.then( function(directory) {
				return directory.getEntryByID(req.params.entryID);
			})
			.then( function(professional) {
				res.send( professional );
				next();
			})
			.catch( function(err) {
				res.send(400, err);
				next(false);
			});
	}
};

module.exports.getEntries = IDirectory.getEntries;
module.exports.createEntry = IDirectory.createEntry;
module.exports.getEntry = IDirectory.getEntry;