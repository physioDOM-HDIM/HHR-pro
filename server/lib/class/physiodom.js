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
	Directory = require("./directory");

/**
 * PhysioDOM
 * 
 * Entry point to the rest API
 * 
 * @constructor
 */
function PhysioDOM( ) {
	this.db = null;

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
	 * Get the beneficiaries list per page
	 * 
	 * @param pg
	 * @param offset
	 * @returns {*}
	 */
	this.getBeneficiaries = function( pg, offset ) {
		var cursor = this.db.collection("beneficiaries").find();
	
		return dbPromise.getList(cursor, pg, offset);
	};
	
	this.createBeneficiary = function( obj ) {
		
	};

	/**
	 * return a promise with the Beneficiaries Object
	 * 
	 * @returns {promise}
	 */
	this.Beneficiaries = function() {
		logger.trace("Beneficiaries");
		var that = this;
		return new promise( function(resolve, reject) {
			var Beneficiaries = require("./beneficiary");
			resolve( new Beneficiaries(that) );
		});
	};

	/**
	 * return a promise with the Directory Object
	 * {@link module:Directory}
	 * @returns {promise}
	 */
	this.Directory = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("Directory");
			resolve( new Directory(that) );
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
				if(err) { reject(err); }
				if(!record) { reject({code:404, msg:"Account not found"}); }
				resolve( new Account(that, record));
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
				record.sessionID = sessionID;
				resolve( new Session(that, record));
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
		console.log("getSessions");
		
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