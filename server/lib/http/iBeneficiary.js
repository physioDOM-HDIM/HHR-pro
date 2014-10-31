/* jslint node:true */
"use strict";

/**
 * IDirectory
 *
 * treat http request for the directory
 * @type {exports}
 */

var Logger = require("logger");
var logger = new Logger("IBeneficiary");

/**
 * IBeneficiaries
 *
 * treat http request for beneficiaries
 */
var IBeneficiaries = {

	/**
	 * get list of beneficiaries
	 * 
	 * Nota : Session must exists
	 */
	getBeneficiaries : function( req, res, next ) {
		logger.trace("getBeneficiaries");
		res.send(501);
		return next();
	},

	createBeneficiary: function(req, res, next ) {
		logger.trace("createBeneficiary");
		res.send(501);
		return next();
	},

	getBeneficiary: function(req, res, next) {
		logger.trace("getBeneficiary");
		res.send(501);
		return next();
	},

	updateBeneficiary: function(req, res, next) {
		logger.trace("updateBeneficiary");
		res.send(501);
		return next();
	},

	deleteBeneficiary: function(req, res, next) {
		logger.trace("deleteBeneficiary");
		res.send(501);
		return next();
	}
};

module.exports = IBeneficiaries;