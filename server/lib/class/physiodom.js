/**
 * @file physiodom.js
 * @module PhysioDOM
 */

/* jslint node:true */

var dbPromise = require("./database"),
	Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
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
	 * @returns {Promise}
	 */
	this.connect = function(uri) {
		var that = this;
		var promise = new Promise( function(resolve, reject) {
			dbPromise.connect(uri)
				.then( function(dbClient) {
					that.db = dbClient;
					resolve(that);
				});
			});
		return promise;
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
	 * @returns {Promise}
	 */
	this.Beneficiaries = function() {
		logger.trace("Beneficiaries");
		var that = this;
		return new Promise( function(resolve, reject) {
			var Beneficiaries = require("./beneficiary");
			resolve( new Beneficiaries(that) );
		});
	};

	/**
	 * return a promise with the Directory Object
	 * {@link module:Directory}
	 * @returns {Promise}
	 */
	this.Directory = function() {
		var that = this;
		return new Promise( function(resolve, reject) {
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
	 * @returns {Promise}
	 */
	this.getAccountByCredentials = function(login, passwd) {
		var search = { login:login, '$or' : [ { passwd:passwd }, { tmpPasswd: passwd } ] };
		var that = this;
		return new Promise( function(resolve, reject) {
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
	 * @returns {Promise}
	 */
	this.getSession = function( sessionID ) {
		var that = this;
		return new Promise( function(resolve, reject) {
			that.db.collection("session").findOne({ _id: ObjectID(sessionID) }, function (err, record) {
				if(!record ) {
					return reject( { code:404, message: "could not find session "+ sessionID});
				}
				record.sessionID = sessionID;
				resolve( new Session(that, record));
			});
		});
	};

	/**
	 * Delate a session given by its id ( cookie )
	 * @param sessionID
	 * @returns {Promise}
	 */
	this.deleteSession = function( sessionID ) {
		var that = this;
		return new Promise( function(resolve, reject) {
			that.db.collection("session").remove({ _id: ObjectID(sessionID) }, function (err, record) {
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