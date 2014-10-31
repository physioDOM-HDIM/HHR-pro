/* jslint node:true */
"use strict";

var Session  = require("./session"),
	promise  = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID;

var Logger = require("logger");
var logger = new Logger("Account");

function Account( physioDOM, obj ) {
	logger.trace("Account constructor");
	var _physioDOM = physioDOM;

	this._id       = null;
	this.login     = null;
	this.password    = null;
	this.tmpPasswd = null;
	this.role      = null;
	this.person    = {id: null, collection: null};
	this.active    = false;
	
	for (var prop in this) {
		if (obj.hasOwnProperty(prop)) {
			this[prop] = obj[prop];
		}
	}

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
			var session = new Session( _physioDOM, obj );
			session.save()
				.then(resolv)
				.catch(reject);
		});
	};
}

module.exports = Account;