/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID;

var logger = new Logger("Beneficiary");


function Beneficiary( ) {
	
	this.setup = function( obj ) {
		// Account.call( this, obj );
		for (var prop in this) {
			if (obj.hasOwnProperty(prop)) {
				this[prop] = obj[prop];
			}
		}
	};

	this.check = function() {
		return true;
	};

	this.getEvents = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getEvents");
		});
	};

	this.save = function() {
		return new promise( function(resolve, reject) {
			logger.trace("save");
		});
	};

	this.getHealthServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getHealthServices");
		});
	};

	this.getSocialServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getSocialServices");
		});
	};

	this.getDietaryServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getDietaryServices");
		});
	};

	this.getProfessionals = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getProfessionals");
		});
	};

	this.getContacts = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getContact");
		});
	};

	this.getMessages = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getMessages");
		});
	};

	this.getIPMessages = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getIPMessages");
		});
	};
}

/*
Beneficiary.prototype = Object.create( Account.prototype, {
	birthdate     : { value:null, enumerable: true, configurable: true,writable: true },
	socialID      : { value:null, enumerable: true, configurable: true,writable: true },
	referring     : { value:null, enumerable: true, configurable: true,writable: true },
	physioDOMBox  : { value:null, enumerable: true, configurable: true,writable: true },
	details : { value: {
		maritalStatus: null,
		disability: {
			type:null,
			level:0
		},
		lifeCondtion: null,
		profession:null
	}, enumerable: true, configurable: true,writable: true },
	perimeter     : { value:null, enumerable: true, configurable: true,writable: true },
});
*/

module.exports = Beneficiary;