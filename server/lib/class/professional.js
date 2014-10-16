/* jslint node:true */
/* global physioDOM */
"use strict";

var Promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Account = require("./account"),
	directorySchema = require("./directorySchema");

var logger = new Logger("Professional");

function Professional() {
	
	this.getById = function( professionalID ) {
		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace("getById");
			physioDOM.db.collection("professionals").findOne({_id: professionalID }, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				for( var prop in doc) {
					if(doc.hasOwnProperty(prop)) {
						that[prop] = doc[prop];
					}
				}
				logger.debug("object ", JSON.stringify(that,null,4) );
				resolve(that);
			});
		});
	};
	
	this.getBeneficiaries = function(pg, offset) {
		// depending of the role of the professional
		// if admin or coordinators : all beneficiaries
		// if other only list of declared beneficiary
		var that = this;
		return new Promise( function( resolve, reject ) {
			db.benefici
		});
	};
}

module.exports = Professional;