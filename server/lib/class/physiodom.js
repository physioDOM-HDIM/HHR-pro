/**
 * @file physiodom.js
 * @module PhysioDOM
 */

/* jslint node:true */
"use strict";

var dbPromise = require("./database"),
	promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	md5 = require('MD5'),
	Logger = require("logger");

var logger = new Logger("PhysioDOM");

var Account = require("./account"),
	Session = require("./session"),
	Directory = require("./directory"),
	Beneficiaries = require("./beneficiaries"),
	Lists = require("./lists"),
	Questionnaires = require("./questionnaires"),
	DataRecords = require("./dataRecords"),
	CurrentStatus = require("./currentStatus"),
	QuestionnaireAnswer = require("./questionnaireAnswer");

/**
 * PhysioDOM
 * 
 * Entry point to the rest API
 * 
 * @constructor
 */
function PhysioDOM( ) {
	this.db = null;

	this.Lists = new Lists();
	
	// @todo report lang into a config file.
	this.lang = ["en","es","nl","fr"];
	
	/**
	 * Connect to the database
	 * 
	 * @param uri
	 * @returns {promise}
	 */
	this.connect = function(uri) {
		var that = this;
		return new promise( function(resolve, reject) {
			dbPromise.connect(uri)
				.then( function(dbClient) {
					that.db = dbClient;
					resolve(that);
				});
		});
	};

	/**
	 * Close the connection to the database
	 */
	this.close = function() {
		this.db.close();
	};

	/**
	 * return a promise with the Beneficiaries Object
	 * 
	 * @returns {promise}
	 */
	this.Beneficiaries = function() {
		return new promise( function(resolve, reject) {
			logger.trace("Beneficiaries");
			resolve( new Beneficiaries() );
		});
	};

	/**
	 * Return a promise with the CurrentStatus Object.
	 * 
	 * @returns {promise}
	 */
	this.CurrentStatus = function() {
		return new promise( function(resolve, reject) {
			logger.trace("CurrentStatus");
			resolve(new CurrentStatus());
		});
	};

	/**
	 * return a promise with the Directory Object
	 * {@link module:Directory}
	 * @returns {promise}
	 */
	this.Directory = function() {
		return new promise( function(resolve, reject) {
			logger.trace("Directory");
			resolve( new Directory() );
		});
	};
	
	/**
	 * return a promise with the Questionnaires Object
	 * {@link module:Questionnaires}
	 * @returns {promise}
	 */
	this.Questionnaires = function() {
		return new promise( function(resolve, reject) {
			logger.trace("Questionnaires");
			resolve( new Questionnaires() );
		});
	};

	/**
	 * Return a promise with the QuestionnaireAnswer object.
	 * {@link module:Questionnaires}
	 * @returns {promise}
	 */
	this.QuestionnaireAnswer = function() {
		return new promise( function(resolve, reject) {
			logger.trace("QuestionnaireAnswer");
			resolve( new QuestionnaireAnswer() );
		});
	},

	this.DataRecords = function( beneficiaryID ) {
		return new promise( function(resolve, reject) {
			logger.trace("DataRecords");
			resolve( new DataRecords(beneficiaryID) );
		});
	};
	
	/**
	 * return a promise with the Session Object
	 */
	this.Session = function() {
		
	};

	/**
	 * 
	 * @param login
	 * @param passwd
	 * @returns {promise}
	 */
	this.getAccountByCredentials = function(login, passwd) {
		var search = { login:login, '$or' : [ { password:md5(passwd) }, { tmpPasswd:md5(passwd) } ] };
		var that = this;
		return new promise( function(resolve, reject) {
			that.db.collection("account").findOne(search, function (err, record) {
				if(err) { throw err; }
				if(!record) { 
					reject({code:404, msg:"Account not found"}); 
				} else {
					resolve(new Account(record));
				}
			});
		});
	};

	/**
	 * 
	 * @param sessionID
	 * @returns {promise}
	 */
	this.getSession = function( sessionID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getSession");
			that.db.collection("session").findOne({ _id: new ObjectID(sessionID) }, function (err, record) {
				if(!record ) {
					return reject( { message: "could not find session "+ sessionID });
				}
				record.sessionID = new ObjectID(sessionID);
				resolve( new Session( record ));
			});
		});
	};

	/**
	 * Delate a session given by its id ( cookie )
	 * @param sessionID
	 * @returns {promise}
	 */
	this.deleteSession = function( sessionID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			that.db.collection("session").remove({ _id: new ObjectID(sessionID) }, function (err, record) {
				if(!record ) {
					return reject({code: 404, message: "could not find session " + sessionID});
				}
				resolve();
			});
		});
	};

	/**
	 * List of active sessions
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param filter
	 * @returns {*}
	 */
	this.getSessions = function(pg, offset, sort, filter) {
		logger.trace("getSessions");
		
		var cursor = this.db.collection("session").find( { 'expire': { '$gt' : (new Date()).getTime() } } );
		if(sort) {
			var cursorSort = {};
			cursorSort[sort] = 1;
			cursor = cursor.sort( cursorSort );
		}
		return dbPromise.getList(cursor, pg, offset);
	};
}

module.exports = PhysioDOM;