/**
 * @file questionnaire.js
 * @module Questionnaire
 */

/* jslint node:true */
/* global physioDOM */
'use strict';

var Promise             = require('rsvp').Promise;
var Logger              = require('logger');
var ObjectID            = require('mongodb').ObjectID;
var CurrentStatusSchema = require("../schema/currentStatusSchema");

var logger = new Logger('CurrentStatus');

/**
 * Manage a questionnaire record
 * 
 * @constructor
 */
function CurrentStatus() {

	/**
	 * Get a current status from the database known by its subject (beneficiary 
	 * ID) and its name (well, nutrition, activity).
	 * 
	 * On success the promise returns the current status record,
	 * else return a 404 error.
	 * 
	 * @param beneficiaryID ID of the beneficiary
	 * @param name          Name of the health status (well, nutrition, activity)
	 * @returns {Promise}
	 */
	this.get = function(beneficiaryID, name) {

		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace('get', beneficiaryID);

			physioDOM.db.collection('currentStatuses').findOne({
				subject: beneficiaryID,
				name: name
			},
			function (err, doc) {
				if (err) {
					logger.alert('Database error');
					throw err;
				}
				if (!doc) {
					logger.trace('not found', beneficiaryID);
					reject({code: 404, error: 'not found'});
				}
				else {
					logger.trace('found', doc);
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					resolve(that);
				}
			});
		});
	};

	/**
	 * Save the current status in the database.
	 * 
	 * @returns {Promise} Promise with the saved object
	 */
	this.save = function() {

		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace('save');

			physioDOM.db.collection('currentStatuses').save(that, function(err, result) {
				if (err) { 
					throw err; 
				}
				if (isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};

	/**
	 * Check the schema of a current status
	 * 
	 * @param entry
	 * @returns {Promise}
	 */
	function checkSchema(entry) {
		return new Promise( function(resolve, reject) {
			logger.trace('checkSchema');
			var schema = '/' + entry.name;
			var check = CurrentStatusSchema.validator.validate( entry, {'$ref': schema} );
			if (check.errors.length) {
				return reject({error: 'bad format', detail: check.errors});
			}
			else {
				return resolve(entry);
			}
		});
	}

	/**
	 * Update the current status
	 * 
	 * `updatedEntry` is a full object that replace the old one
	 * 
	 * @param updatedEntry
	 * @returns {Promise}
	 */
	this.update = function(updatedEntry) {

		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace('update', updatedEntry);
			if (that._id && that._id !== updatedEntry._id) {
				logger.warning('Not same current status');
				throw {code: 405, message: 'Not same current status'};
			}
			updatedEntry._id = that._id;
			checkSchema(updatedEntry)
				.then(function (updatedEntry) {
					logger.debug('Schema is valid');
					for (var key in updatedEntry) {
						if (key !== '_id' && updatedEntry.hasOwnProperty(key)) {
							that[key] = updatedEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};
}

module.exports = CurrentStatus;