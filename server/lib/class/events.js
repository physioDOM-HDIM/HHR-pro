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

	this.getLastOne = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getLastOne", that.subject);
			var search = { subject: that.subject };

			physioDOM.db.collection("events").find(search).sort({datetime:-1}).limit(1).toArray( function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				logger.debug("found", doc);
				if(!doc || !doc[0]) {
					reject( {code:404, error:"not found"});
				} else {
					for (var prop in doc[0]) {
						if (doc[0].hasOwnProperty(prop)) {
							that[prop] = doc[0][prop];
						}
					}
					resolve(that);
				}
			});
		});
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

	this.remove = function(eventID) {
		return new promise( function(resolve, reject) {
			var search = {_id: eventID};

			physioDOM.db.collection("events").remove( search, function(err, nb) {
				if(err) {
					reject(err);
				} else {
					if( nb ) {
						resolve( true );
					} else {
						reject( { err:404, message: "no item found"});
					}
				}
			});
		});
	};

	this.setup = function(service, operation, elementID, senderID) {
		var that = this,
			eventObj = {
				ref: elementID,
				sender: senderID,
				datetime: moment().toISOString(),
				subject: this.subject,
				service: service,
				operation: operation
			};

		return this.getLastOne()
			.then(function(lastEvent) {
				logger.trace("ADD EVENT", lastEvent );
	
				if(eventObj.ref.toString() === lastEvent.ref.toString()
					&& ["update","overtake"].indexOf(eventObj.operation) !== -1
					&& ["update","overtake"].indexOf(lastEvent.operation) !== -1
					&& eventObj.sender.toString() === lastEvent.sender.toString()) {
	
					logger.trace("BY REPLACE" );
					return that.remove(lastEvent._id).then(function() {
						return checkSchema(eventObj)
							.then(function(eventObj) {
								return that.save(eventObj);
							}, function(err) {
								logger.trace(err);
							});
					});
				} else {
					logger.trace("BY ADDING" );
					return checkSchema(eventObj)
						.then(function(eventObj) {
							return that.save(eventObj);
						}, function(err) {
							logger.trace(err);
						});
				}
			})
			.catch( function() {
				return checkSchema(eventObj)
					.then(function(eventObj) {
						return that.save(eventObj);
					}, function(err) {
						logger.trace(err);
					});
			});
	};

}

module.exports = events;