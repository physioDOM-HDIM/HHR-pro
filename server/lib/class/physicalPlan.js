/**
 * @file physicalPlan.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var logger = new Logger("PhysicalPlan");

function physicalPlan(beneficiaryID) {
	this.beneficiary = beneficiaryID;

	this.getItems = function( pg, offset, sort, sortDir, filter) {
		logger.trace("getItems");
		
		pg = pg || 1;
		offset = offset || 50;

		var search = { beneficiary : this.beneficiary };
		var cursor = physioDOM.db.collection("physicalPlan").find(search);
		var cursorSort = {};
		if(sort) {
			cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
		} else {
			cursorSort.datetime = -1;
		}
		logger.debug("test", search );
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	this.getItemsArray = function( pg, offset, sort, sortDir, filter) {
		logger.trace("getItemsArray");

		pg = pg || 1;
		offset = offset || 50;

		var search = { beneficiary : this.beneficiary };
		var cursor = physioDOM.db.collection("physicalPlan").find( search );
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

			physioDOM.db.collection("physicalPlan").find(search).sort({datetime:-1}).limit(1).toArray( function (err, doc) {
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

			physioDOM.db.collection("physicalPlan").save( that, function(err, result) {
				if(err) {
					throw err;
				}
				if( isNaN(result)) {
					that._id = result._id;
				}
				physioDOM.Beneficiaries()
					.then(function (beneficiaries) {
						return beneficiaries.getHHR( that.beneficiary );
					})
					.then(function (beneficiary) {
						beneficiary.pushPhysicalPlanToQueue( that, true );
					})
					.then( function(msg) {
						resolve(that);
					});
			});
		});
	};

	this.setup = function( beneficiaryID, physicalPlanObj, professionalID ) {
		logger.trace("setup");

		for (var prop in physicalPlanObj) {
			if (physicalPlanObj.hasOwnProperty(prop)) {
				this[prop] = physicalPlanObj[prop];
			}
		}

		this.beneficiary = new ObjectID(beneficiaryID);
		this.professional = new ObjectID(professionalID);
		this.datetime = moment().toISOString();

		return this.save();
	};
}

module.exports = physicalPlan;