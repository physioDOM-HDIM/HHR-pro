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
 * @file dietaryPlan.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var logger = new Logger("DietaryPlan");

function dietaryPlan(beneficiaryID) {
	this.beneficiary = beneficiaryID;

	this.getItems = function( pg, offset, sort, sortDir, filter) {
		logger.trace("getItems");
		
		pg = pg || 1;
		offset = offset || 50;

		var search = { beneficiary: this.beneficiary };
		var cursor = physioDOM.db.collection("dietaryPlan").find( search );
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.datetime = -1;
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	this.getItemsArray = function( pg, offset, sort, sortDir, filter) {
		logger.trace("getItemsArray");

		pg = pg || 1;
		offset = offset || 50;

		var search = { beneficiary: this.beneficiary };
		var cursor = physioDOM.db.collection("dietaryPlan").find( search );
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.datetime = -1;
		}
		cursor = cursor.sort( cursorSort );
		return dbPromise.getArray(cursor, pg, offset);
	};

	this.getLastOne = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getLastOne", that.beneficiary);
			var search = { beneficiary: that.beneficiary };

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
			var search = {beneficiary: that.beneficiary};

			physioDOM.db.collection("dietaryPlan").count(search, function (err, count) {
				if (err) {
					throw err;
				}
				physioDOM.db.collection("dietaryPlan").save(that, function (err, result) {
					if (err) {
						throw err;
					}
					if (isNaN(result)) {
						that._id = result._id;
					}
					physioDOM.Beneficiaries()
						.then(function (beneficiaries) {
							logger.debug("subject", that.beneficiary);
							return beneficiaries.getHHR(that.beneficiary);
						})
						.then(function (beneficiary) {
							beneficiary.pushDietaryPlanToQueue(that, true);
						})
						.then(function (msg) {
							logger.debug("msg to queue", msg);
							if( count ) { that.count = count; }
							resolve(that);
						});
				});
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