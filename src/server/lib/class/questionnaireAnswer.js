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
 * @file questionnaire.js
 * @module Questionnaire
 */

/* jslint node:true */
/* global physioDOM */
'use strict';

var RSVP = require('rsvp'),
	promise = require('rsvp').Promise,
	Logger = require('logger'),
	ObjectID = require('mongodb').ObjectID,
	QuestionnaireAnswerSchema = require('./../schema/questionnaireAnswerSchema');

var logger = new Logger("QuestionnaireAnswer");

/**
 * Manage a questionnaire answer.
 * 
 * @constructor
 */
function QuestionnaireAnswer() {

	/**
	 * Save the questionnaire answer in the database.
	 * 
	 * @returns {promise} Promise with the saved object
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace('save');

			physioDOM.db.collection('questionnaireAnswers').save(that, function(err, result) {
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
	 * Check the schema of a questionnaire answer record.
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkSchema(entry) {
		return new promise( function(resolve, reject) {
			logger.trace('checkSchema');
			var check = QuestionnaireAnswerSchema.validator.validate( entry, { "$ref":"/QuestionnaireAnswer"} );
			if (check.errors.length) {
				return reject({error: 'Bad format', detail: check.errors});
			}
			else {
				return resolve(entry);
			}
		});
	}

	/**
	 * Initialize a questionnaire answer with the object `newEntry`.
	 * 
	 * @param newEntry
	 * @returns {promise}
	 */
	this.create = function(newEntry) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace('create');
			checkSchema(newEntry)
				.then(function(entry) {
					for (var key in newEntry) {
						if (newEntry.hasOwnProperty(key)) {
							that[key] = newEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	/**
	 * Get a questionnaire answer from the database known by its ID.
	 * 
	 * On success the promise returns the questionnaire answer record,
	 * else return an error (code 404)
	 * 
	 * @param id ID of the wanted questionnaire answer
	 * @returns {promise}
	 */
	this.getById = function( id ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace('getById', id);
			physioDOM.db.collection('questionnaireAnswers').findOne({_id: id}, function (err, doc) {
				if (err) {
					logger.alert('Database Error');
					throw err;
				}
				if (!doc) {
					reject({code: 404, error: 'Not found'});
				}
				else {
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

	this.remove = function( ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace('remove', that._id);
			physioDOM.db.collection('questionnaireAnswers').remove({ _id: that._id }, function (err, doc) {
				if (err) {
					logger.alert('Database Error');
					throw err;
				}
				resolve();
			});
		});
	};
}

module.exports = QuestionnaireAnswer;