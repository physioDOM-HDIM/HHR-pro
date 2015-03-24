/**
 * @module Session
 */

/* jslint node:true */
/* glooal physioDOM */
"use strict";

var Session  = require("./session"),
	promise  = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID;

var Logger = require("logger");
var logger = new Logger("Account");

/**
 * Account object
 * 
 * @param obj
 * @constructor
 */
function Account( obj ) {
	logger.trace("Account constructor");

	this._id       = null;
	this.login     = null;
	this.password  = null;
	this.tmpPasswd = null;
	this.role      = null;
	this.person    = {id: null, collection: null};
	this.active    = false;
	
	for (var prop in this) {
		if (obj.hasOwnProperty(prop)) {
			this[prop] = obj[prop];
		}
	}

	/**
	 * Create a session for the current account
	 * 
	 * @returns {promise}
	 */
	this.createSession = function () {
		logger.trace("Account.createSession");
		var that = this;

		return new promise(function ( resolv, reject ) {
			if( !that.active ) {
				return reject({code:403, message:"account not activate"});
			}
			var obj = {
				sessionID: new ObjectID(),
				createDate : (new Date()).toISOString(),
				expire   : (new Date()).getTime() + 5 * 60 * 1000,
				role     : that.role,
				person   : that.person
			};
			var session = new Session( obj );
			session.getPerson()
				.then( function( session ) {
					logger.debug("createSession", session.person );
					if( session.role === "beneficiary" ) {
						session.beneficiary = session.person.item._id;
					}
					session.lang = session.person.item.communication || physioDOM.lang;
					return session.save();
				})
				.then(resolv)
				.catch(reject);
		});
	};
}

module.exports = Account;