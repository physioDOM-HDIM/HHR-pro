/**
 * @file beneficiaries.js
 * @module Beneficiary
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

//var Person = require("./person.js");
// var Account = require("./account.js");
var promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Beneficiary = require("./beneficiary");

var logger = new Logger("Directory");

/**
 * Beneficiaries
 *
 * This class allows to manage the Beneficiaries directory
 *
 * @constructor
 */
function Beneficiaries( ) {

	/**
	 * return the list of beneficiaries per page
	 * A professional identified by its profID could see only attached beneficiaries
	 * A Administrator or coordinator could see every body
	 */
	this.getBeneficiaries = function( profID, pg, offset, sort, filter) {
		return new promise( function(resolve, reject) {
			logger.trace("getBeneficiaries");
			var filter = filter ? filter : {};
			filter.professionals = { '$elemMatch' : { professionalID : new ObjectID(profID) } };
			var cursor = physioDOM.db.collection("beneficiaries").find( filter );
			if(sort) {
				var cursorSort = {};
				cursorSort[sort] = 1;
				cursor = cursor.sort( cursorSort );
			}
			return dbPromise.getList(cursor, pg, offset);
		});
	};

	/**
	 * Only coordinators or administrators are allowed to create new beneficiary
	 */
	this.createBeneficiary = function( profID, newBeneficiary ) {
		
	};

	/**
	 * get a beneficiary by its entryID, 
	 * a professional given by its profID could see only attached beneficiaries
	 * @param profID
	 * @param entryID
	 */
	this.getBeneficiaryByID = function( profID, entryID ) {
		
	};

	/**
	 * update a beneficiary file
	 * 
	 * Only coordinators could update a beneficiary entry
	 * @param profID
	 * @param updatedItem
	 */
	this.updateBeneficiary = function( profID, updatedItem ) {
		
	};

	/**
	 * remove a beneficiary
	 * 
	 * this is exceptional operation only done by admins or coordinators
	 * 
	 * @param profID
	 * @param beneficiaryID
	 */
	this.deleteBeneficiary = function(profID, beneficiaryID) {
		
	};
}

module.exports = Beneficiaries;