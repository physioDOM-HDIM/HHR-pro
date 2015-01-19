/**
 * @file dietaryPlan.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var logger = new Logger("DietaryPlan");

function dietaryPlan(beneficiaryID) {
	this.subject = beneficiaryID;

	this.getLastOne = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getLastOne", that.subject);
			var search = { beneficiary: that.subject };

			// ensure that the dietaryPlan is related to the beneficiary
			physioDOM.db.collection("dietaryPlan").find(search).sort({datetime:-1}).limit(1).toArray( function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc && doc[0]) {
					reject( {code:404, error:"not found"});
				} else {
					for (var prop in doc[0]) {
						if (doc[0].hasOwnProperty(prop)) {
							that[prop] = doc[0][prop];
						}
					}
					resolve(that);
				}
			});
		});
	};

	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save");

			physioDOM.db.collection("dietaryPlan").save( that, function(err, result) {
				if(err) {
					throw err;
				}
				if( isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};

	this.setup = function( beneficiaryID, dietaryPlanObj, professionalID ) {
		logger.trace("setup");

		for (var prop in dietaryPlanObj) {
			if (dietaryPlanObj.hasOwnProperty(prop)) {
				this[prop] = dietaryPlanObj[prop];
			}
		}

		this.beneficiary = new ObjectID(beneficiaryID);
		this.professional = new ObjectID(professionalID);
		this.datetime = moment().toISOString();

		return this.save();
	};
}

module.exports = dietaryPlan;