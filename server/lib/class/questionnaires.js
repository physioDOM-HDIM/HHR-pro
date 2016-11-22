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
 * @file directory.js
 * @module Questionnaires
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Questionnaire = require("./questionnaire");

var logger = new Logger("Questionnaires");

/**
 * Questionnaires
 * 
 * This class allows to manage questionnaires
 * 
 * @constructor
 */
function Questionnaires( ) {

	/**
	 * DEV ONLY
	 */
	this.createQuestionnaire = function( newQuestionnaire ) {
		return new promise( function(resolve, reject) {
			logger.trace("createQuestionnaire", newQuestionnaire);
			if (newQuestionnaire) {
				var entry = new Questionnaire();
				return entry.setup(newQuestionnaire)
					.then(resolve)
					.catch(function (err) {
						logger.alert("error ", err);
						console.log(err);
						reject(err);
					});
			} else {
				return reject("Error no entry");
			}
		});
	};

	/**
	 * return the list of questionnaires per page
	 * @param pg
	 * @param offset
	 * @returns {promise}
	 */
	this.getQuestionnaires = function(pg, offset) {
		logger.trace("getQuestionnaires");
		var cursor = physioDOM.db.collection("questionnaires").find({}, {name: 1, ref: 1, label: 1});
		cursor = cursor.sort( {name: 1} );
		return dbPromise.getList(cursor, pg, offset);
	};

	/**
	 * get a questionnaire by its name
	 *
	 * @param qName
	 * @returns {promise}
	 */
	this.getQuestionnaireByName = function(qName) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getQuestionnaireByName", qName);
			physioDOM.db.collection("questionnaires").findOne({ name: qName }, function (err, doc) {
				if (err) {
					logger.alert("Database Error");
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
					resolve(that);
				}
			});
		});
	};

	/**
	 * get a questionnaire by its id
	 *
	 * @param qName
	 * @returns {promise}
	 */
	this.getQuestionnaireByID = function(entryID) {
		logger.trace("getQuestionnaireByID", entryID);
		var questionnaireByID = new ObjectID(entryID);
		var questionnaire = new Questionnaire();
		return questionnaire.getById(questionnaireByID);
	};
}

module.exports = Questionnaires;