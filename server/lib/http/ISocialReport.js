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