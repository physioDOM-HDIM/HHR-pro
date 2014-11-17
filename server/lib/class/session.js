/**
 * @module Session
 */


/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID;

var logger = new Logger("Session");

/**
 * Session object
 * 
 * @param obj
 * @constructor
 */
function Session( obj ) {
	var sessionExpire = 5 * 60 * 1000;
	
	logger.trace("Session constructor");
	
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
			physioDOM.db.collection("session").save(that.toMongo(), function(err, item) {
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
		var that = this;
		return new promise( function(resolve, reject) {
			logger.debug("collection",that.person.collection );
			if (that.person.collection === "professionals") {
				physioDOM.Directory()
					.then(function (directory) {
						return directory.getEntryByID( new ObjectID(that.person.id));
					})
					.then(function (professional) {
						that.person.item = professional;
						return that;
					})
					.then( resolve )
					.catch( reject );
			} else {
				physioDOM.Beneficiaries()
					.then(function(beneficiaries) {
						return beneficiaries.getBeneficiaryByID(null, new ObjectID(that.person.id));
					})
					.then( function( beneficiary ) {
						that.person.item = professional;
						return that;
					})
					.then( resolve )
					.catch( reject );
			}
		});
	};
}

module.exports = Session;
