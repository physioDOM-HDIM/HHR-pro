/* jslint node:true */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger");

var logger = new Logger("Session");

function Session( physioDOM, obj ) {
	var sessionExpire = 5 * 60 * 1000;
	
	logger.trace("Session constructor");
	
	var _physioDOM = physioDOM;
	
	this.sessionID = null;
	this.createDate = null;
	this.expire = null;
	this.role = null;
	this.person = null;
	
	for( var prop in this ) {
		if( obj.hasOwnProperty(prop) ) {
			this[prop] = obj[prop];
		}
	}
	
	this.toMongo = function() {
		logger.trace("Session.toMongo");
		return {
			_id        : this.sessionID,
			createDate : this.createDate,
			expire     : this.expire,
			role       : this.role,
			person     : this.person
		};
	};
	
	this.save = function() {
		logger.trace("Session.save");
		var that = this;
		return new promise( function( resolv, reject ) {
			_physioDOM.db.collection("session").save(that.toMongo(), function(err, item) {
				if(err) { reject(err); }
				if(item) {
					resolv(that);
				} else {
					reject("unknown error ",item);
				}
			});
		});
	};

	this.update = function () {
		logger.trace("Session update");
		this.expire = (new Date()).getTime() + sessionExpire;
		return this.save();
	};
	
	this.getPerson = function() {
		logger.trace("getPerson");
		// var that = this;
		return new promise( function(resolve, reject) {
			resolve( {} );
		});
	};
}

module.exports = Session;
