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
	
	this.sessionID   = null;
	this.createDate  = null;
	this.expire      = null;
	this.role        = null;
	this.roleClass   = null;
	this.firstlogin  = null;
	this.person      = null;
	this.beneficiary = null;
	
	for( var prop in this ) {
		if( obj.hasOwnProperty(prop) ) {
			this[prop] = obj[prop];
		}
	}
	
	this.toMongo = function() {
		logger.trace("Session.toMongo");
		return {
			_id         : this.sessionID,
			createDate  : this.createDate,
			expire      : this.expire,
			role        : this.role,
			roleClass   : this.roleClass,
			firstlogin  : this.firstlogin,
			person      : { id: this.person.id, collection : this.person.collection },
			beneficiary : this.beneficiary
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
						return beneficiaries.getHHR(new ObjectID(that.person.id));
					})
					.then( function( beneficiary ) {
						that.person.item = beneficiary;
						return that;
					})
					.then( resolve )
					.catch( reject );
			}
		});
	};
}

module.exports = Session;
