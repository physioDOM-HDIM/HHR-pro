/* jslint node:true */
"use strict";

var Person   = require("./person"),
	Session  = require("./session"),
	Promise  = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID;

var Logger = require("logger");
var logger = new Logger("Account");

function Account( physioDOM, obj ) {
	logger.trace("Account constructor");
	var _physioDOM = physioDOM;

	this._id       = null;
	this.login     = null;
	this.passwd    = null;
	this.tmpPasswd = null;
	this.role      = null;
	this.person    = {id: null, type: null};
	
	for (var prop in this) {
		if (obj[prop]) this[prop] = obj[prop];
	}

	this.createSession = function () {
		logger.trace("Account.createSession");
		var that = this;

		var promise = new Promise(function ( resolv, reject ) {
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

		return promise;
	};
}

module.exports = Account;