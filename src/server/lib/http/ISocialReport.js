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
 * @file ISocialReport.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";


var Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Promise = require("rsvp").Promise,
	moment = require("moment"),
    SocialReport = require('../class/socialReport.js');
var logger = new Logger("ISocialReport");

/**
 * function used to return errors
 *
 * @param err  error obkect
 * @param res  response object
 * @param next restify callback
 */
function errHandler( err, res, next ) {
	if(err.stack) {
		console.log(err.stack);
	} else {
		logger.alert(err);
	}
	res.send(err.code || 400, err);
	next(false);
}

var ISocialReport = {
	getLastReport : function(req, res, next) {
		logger.trace("getLastReport");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function( beneficiary ) {
				return (new SocialReport( beneficiary._id)).getLast() ;
			})
			.then( function( resp ) {
				res.send(resp);
				next();
			})
			.catch( function(err) { errHandler(err, res, next); });
	},
	
	setLastReport: function(req,res,next) {
		logger.trace("setLastReport");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function( beneficiary ) {
				return (new SocialReport( beneficiary._id)).setReport( req.body,req.session.person.id );
			})
			.then( function( resp ) {
				res.send(resp);
				next();
			})
			.catch( function(err) { errHandler(err, res, next); });
	}
};

module.exports = ISocialReport;