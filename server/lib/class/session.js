/* jslint node:true */
"use strict";

var Promise = require("rsvp").Promise;
var Logger = require("logger");
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
		if( obj[prop] ) {
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
		var promise = new Promise( function( resolv, reject ) {
			_physioDOM.db.collection("session").save(that.toMongo(), function(err, item) {
				if(err) { reject(err); }
				if(item) {
					resolv(that);
				} else {
					reject("unknown error ",item);
				}
			});
		});
		return promise;
	};

	this.update = function () {
		logger.trace("Session update");
		this.expire = (new Date()).getTime() + sessionExpire;
		return this.save();
	};
}

module.exports = Session;
