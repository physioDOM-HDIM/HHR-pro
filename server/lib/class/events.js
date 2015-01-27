/**
 * @file event.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	dbPromise = require("./database.js"),
	EventsSchema = require("../schema/eventsSchema"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var logger = new Logger("Events");

function events(beneficiaryID) {
	this.subject = beneficiaryID;

	function checkSchema(entry) {
		return new promise( function(resolve, reject) {
			logger.trace('checkSchema');
			var check = EventsSchema.validator.validate(entry, {'$ref': '/Events'});
			if (check.errors.length) {
				return reject({error: 'Bad format', detail: check.errors});
			}
			else {
				return resolve(entry);
			}
		});
	}

	this.getItems = function( pg, offset, sort, sortDir, filter) {
		pg = pg || 1;
		offset = offset || 50;

		var search = { subject: this.subject };

		var cursor = physioDOM.db.collection("events").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.datetime = -1;
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	this.save = function(eventObj) {
		return new promise( function(resolve, reject) {
			logger.trace("save" );
			physioDOM.db.collection("events").save( eventObj, function(err, result) {
				if(err) {
					throw err;
				}
				if( isNaN(result)) {
					eventObj._id = result._id;
				}
				resolve(eventObj);
			});
		});
	};

	this.setup = function(service, operation, elementID) {
		var that = this,
			eventObj = {
				ref: elementID,
				datetime: moment().toISOString(),
				subject: this.subject,
				service: service,
				operation: operation
			};

		return checkSchema(eventObj)
			.then(function(eventObj) {
				return that.save(eventObj);
			}, function(err) {
				logger.trace(err);
			});
	};

}

module.exports = events;