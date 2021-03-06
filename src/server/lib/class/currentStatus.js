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

var Promise             = require('rsvp').Promise;
var Logger              = require('logger');
var ObjectID            = require('mongodb').ObjectID;
var CurrentStatusSchema = require("../schema/currentStatusSchema");

var logger = new Logger('CurrentStatus');

function questionnaire(name) {
	return {
		"name":name,
		"date":null,
		"score":null,
		"answerID":null,
		"comment":""
	};
}

function param(name) {
	return {
		"name": name,
		"value":null,
		"comment":"",
		"date":null
	};
}

function currentNutrition() {
	return {
		name : 'nutrition',
		subject: null,
		size: null,
		validated: {
			status: false,
			author : null,
			date: null
		},
		questionnaires : {
			"MNA"     : new questionnaire("MNA"),
			"MNA_MINI": new questionnaire("MNA_MINI"),
			"SNAQ"    : new questionnaire("SNAQ"),
			"DHD-FFQ" : new questionnaire("DHD-FFQ")
		},
		parameters : {
			"WEG":  new param("WEG"),
			"LFR" : new param("LFR"),
			"BMI":  new param("BMI")
		},
		dietPresc : {
			prescription:null,
			date: null,
			comment:null
		},
		assistance:[]
	};
}

function currentActivity() {
	return {
		name : 'activity',
		subject: null,
		validated: {
			status: false,
			author : null,
			date: null
		},
		parameters : {
			"DIST": new param("DIST")
		}
	};
}

function currentWell() {
	return {
		name : 'well',
		subject: null,
		validated: {
			status: false,
			author : null,
			date: null
		},
		questionnaires : {
			"SF36"     : new questionnaire("SF36")
		},
		parameters : null
	};
}

function currentFrailty() {
	return {
		name : 'frailty',
		subject: null,
		validated: {
			status: false,
			author : null,
			date: null
		},
		questionnaires : {
			"CHAIR_TEST" : new questionnaire("CHAIR_TEST")
		},
		failRisk: false
	};
}


/**
 * Manage a questionnaire record
 * 
 * @constructor
 */
function CurrentStatus() {
	this._id = null;
	this.name = "";
	this.subject = null;
	this.validated = { status: false, author:null, date:null };
	this.questionnaires = {};
	this.parameters = {};
	
	this.isValidated = function(beneficiaryID) {
		return new Promise( function(resolve, reject) {
			logger.trace('isValidated', beneficiaryID);
			
			physioDOM.db.collection('currentStatuses').find({
				subject: beneficiaryID
			}).toArray( function (err, doc) {
				if (err) {
					logger.alert('Database error');
					throw err;
				}
				if ( doc.length === 0 ) {
					// reject({code: 404, error: 'not found'});
					resolve(false);
				}
				else {
					var valid = true;
					var statuses = {};
					doc.forEach( function(status) {
						statuses[status.name] = status.validated && status.validated.status ?status.validated.status:false;
					});
					physioDOM.config.healthStatusValidation.forEach( function( name ) {
						if( !statuses[name] || !statuses[name] ) {
							valid = false;
						}
					});
					resolve(valid);
				}
			});
		});
	};

	/**
	 * Get a current status from the database known by its subject (beneficiary 
	 * ID) and its name (well, nutrition, activity, frailty).
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
			logger.trace('get', beneficiaryID, name);
			var status;
			
			switch( name ) {
				case "nutrition":
					status = currentNutrition();
					break;
				case "activity":
					status = currentActivity();
					break;
				case "well":
					status = currentWell();
					break;
				case "frailty":
					status = currentFrailty();
					break;
			}
			Object.keys(status).forEach( function(key) {
				that[key] = status[key];
			});
			
			var search = {
				subject: beneficiaryID,
				name: name
			};
			physioDOM.db.collection('currentStatuses').findOne(search,
				function (err, doc) {
					if (err) {
						logger.alert('Database error');
						throw err;
					}
					if (!doc) {
						logger.trace('not found', beneficiaryID);
						resolve(status);
					}
					else {
						logger.trace('found');
						for (var prop in doc) {
							if (that.hasOwnProperty(prop)) {
								that[prop] = doc[prop];
							}
						}
						// logger.debug(JSON.stringify( that, "", 4));
						resolve(that);
					}
				}
			);
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
				logger.warning( JSON.stringify(check.errors,"",4) );
				reject({error: 'bad format', detail: check.errors});
			}
			else {
				resolve(entry);
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
	this.update = function(updatedEntry, professionalID) {

		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace('update');
			// logger.debug( JSON.stringify(updatedEntry,"",4));
			if (that._id && that._id !== updatedEntry._id) {
				logger.warning('Not same current status');
				throw {code: 405, message: 'Not same current status'};
			}
			updatedEntry._id = that._id;
			
			for (var key in updatedEntry) {
				switch( key ) {
					case '_id':
						break;
					case 'questionnaires':
						var questionnaires = updatedEntry[key];
						questionnaires.forEach( function(questionnaire ) {
							if( that.questionnaires[questionnaire.name] ) {
								that.questionnaires[questionnaire.name].comment = questionnaire.comment;
								if (that.questionnaires[questionnaire.name].score !== questionnaire.score ) {
									that.questionnaires[questionnaire.name] = questionnaire;
									that.questionnaires[questionnaire.name].source = professionalID;
								}
							} else {
								that.questionnaires[questionnaire.name] = questionnaire;
								that.questionnaires[questionnaire.name].source = professionalID;
							}
						});
						break;
					case 'parameters':
						var parameters = updatedEntry[key];
						parameters.forEach( function(parameter ) {
							if( that.parameters[parameter.name] ) {
								that.parameters[parameter.name].comment = parameter.comment;
								if (that.parameters[parameter.name].value !== parameter.value ) {
									that.parameters[parameter.name] = parameter;
									that.parameters[parameter.name].source = professionalID;
								}
							} else {
								that.parameters[parameter.name] = parameter;
								that.parameters[parameter.name].source = professionalID;
							}
						});
						break;
					default:
						that[key] = updatedEntry[key];
						break;
				}
			}
			
			// console.log( "saving");
			// console.log( JSON.stringify(that, "", 4));
			that.save()
				.then( resolve )
				.catch( reject );
			
		});
	};

	/**
	 * Save a questionnaire answer in a current health status,
	 * if the status don't already have answer data.
	 * 
	 * @param  {Object} beneficiaryID ID of the beneficiary
	 * @param  {Object} answer        Answer object
	 * @param  {String} statusName    Name of the status where 
	 *                                to save the answer data
	 * @param  {String} prefix        Prefix of the answer properties
	 */
	this._saveAnswerInQuestionnaire = function(beneficiaryID, answer, statusName, prefix) {
		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace('_saveAnswerInQuestionnaire');

			new CurrentStatus().get(beneficiaryID, statusName)
			.then(function(status) {
				if (!status[prefix + 'Answer']) {
					status[prefix + 'Answer'] = answer._id.toString();
					status[prefix + 'Date'] = answer.datetime;
					status[prefix + 'Score'] = answer.score;
					status.save()
					.then(function() {
						resolve(answer);
					})
					.catch(function(err) {
						reject({code: 500, error: err});
					});
				}
				else {
					resolve(answer);
				}
			})
			.catch (function (err) {
				var status = {};
				status.name = statusName;
				status.subject = beneficiaryID;
				status[prefix + 'Answer'] = answer._id.toString();
				status[prefix + 'Date'] = answer.datetime;
				status[prefix + 'Score'] = answer.score;
				that.update(status)
				.then(function() {
					resolve(answer);
				})
				.catch(function(err) {
					reject({code: 500, error: err});
				});
			});
		});
	};

	this.saveAnswer = function(beneficiaryID, questionnaireName, answer) {
		switch (questionnaireName) {

			case 'SF36':
				return this._saveAnswerInQuestionnaire(beneficiaryID, answer, 'well', 'sf36');
			case 'MNA':
				return this._saveAnswerInQuestionnaire(beneficiaryID, answer, 'nutrition', 'mna');
			case 'MNA_MINI':
				return this._saveAnswerInQuestionnaire(beneficiaryID, answer, 'nutrition', 'mnaSf');
			case 'SNAQ':
				return this._saveAnswerInQuestionnaire(beneficiaryID, answer, 'nutrition', 'snaq');
			case 'DHD-FFQ':
				return this._saveAnswerInQuestionnaire(beneficiaryID, answer, 'nutrition', 'dhd');
			case 'CHAIR_TEST':
				return this._saveAnswerInQuestionnaire(beneficiaryID, answer, 'frailty', 'chairStand');
			default:
				return new Promise( function(resolve, reject) {
					resolve(answer);
				});
		}
	};
}

module.exports = CurrentStatus;