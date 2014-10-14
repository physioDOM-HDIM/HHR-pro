/* jslint node:true */

var dbPromise = require("../lib/database.js"),
	Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID;

var Account = require("./account"),
	Session = require("./session");

function PhysioDOM( ) {
	this.db = null;
	
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
	
	this.close = function() {
		this.db.close();
	};
	
	this.getBeneficiaries = function( pg, offset ) {
		var cursor = this.db.collection("beneficiaries").find();
	
		return dbPromise.getList(cursor, pg, offset);
	};
	
	this.createBeneficiary = function( obj ) {
		
	};
	
	this.getDirectory = function( pg, offset, sort, filter) {
		var cursor = this.db.collection("practitioner").find();
		if(sort) {
			var cursorSort = {};
			cursorSort[sort] = 1;
			cursor = cursor.sort( cursorSort );
		}
		return dbPromise.getList(cursor, pg, offset);
	};
	
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