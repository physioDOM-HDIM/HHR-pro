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
	ObjectID = require("mongodb").ObjectID;

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
	 * return the list of questionnaires per page
	 * @param pg
	 * @param offset
	 * @returns {promise}
	 */
	this.getQuestionnaires = function(pg, offset) {
		logger.trace("getQuestionnaires");
		var cursor = physioDOM.db.collection("questionnaires").find({}, {name: 1, text: 1});
		cursor = cursor.sort( {name: 1} );
		return dbPromise.getList(cursor, pg, offset);
	};

	/**
	 * get a questionnaire by its name
	 *
	 * @param qName
	 * @returns {promise}
	 */
	this.getQuestionnaire = function(qName) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getQuestionnaire", qName);
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
}

module.exports = Questionnaires;