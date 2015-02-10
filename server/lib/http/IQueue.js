/**
 * @file IBeneficiary.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Queue = require("../class/queue.js");
var logger = new Logger("IQueue");

/**
 * IBeneficiaries
 *
 * treat http request for beneficiaries
 */
var IQueue = {

	/**
	 * Init the hhr for the selected patient
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	init: function( req, res, next ) {
		logger.trace("init hhr", req.session.beneficiary );
		
		var queue = new Queue( req.session.beneficiary );
		queue.init( )
			.then( function ( response ) {
				res.send(200);
				next();
			})
			.catch( function(err) {
				logger.error("error ",err);
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	status: function( req, res, next ) {
		logger.trace("status");
		try {
			var msg = JSON.parse(req.body.toString());
			logger.debug("status msg :", msg );
			var queue = new Queue( new ObjectID( msg.subject) );
			queue.status( msg )
				.then( function() {
					res.send(200);
					next();
				})
				.catch( function(err) {
					res.send(500 || err.code, err.message );
					next(false);
				});
		} catch(err) {
			res.send(400);
			next(false);
		}
	},
	
	history: function( req, res, next ) {
		logger.trace("history");

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				return beneficiaries.getHHR( req.session.beneficiary );
			})
			.then(function (beneficiary) {
				if (beneficiary.biomasterStatus) {
					return beneficiary.pushHistory();
				} else {
					return false;
				}
			})
			.then(function( result ) {
				logger.debug("end sending history");
				if( result ) {
					res.send(result);
				} else {
					res.send({ code:200, message:"biomaster not initialized"});
				}
				next();
			});
	},
	
	dhdffq: function( req, res, next ) {
		logger.trace("dhdffq");

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				return beneficiaries.getHHR( req.session.beneficiary );
			})
			.then(function (beneficiary) {
				if (beneficiary.biomasterStatus) {
					return beneficiary.pushLastDHDFFQ();
				} else {
					return false;
				}
			})
			.then(function( result ) {
				logger.debug("end dhdffq");
				if( result ) {
					res.send(result);
				} else {
					res.send({ code:200, message:"biomaster not initialized"});
				}
				next();
			});
	},
	
	measurePlan: function( req, res, next ) {
		logger.trace("measurePlan");

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				return beneficiaries.getHHR( req.session.beneficiary );
			})
			.then(function (beneficiary) {
				if (beneficiary.biomasterStatus) {
					return beneficiary.getMeasurePlan();
				} else {
					return false;
				}
			})
			.then(function( result ) {
				logger.debug("end measure plan");
				if( result ) {
					res.send(result);
				} else {
					res.send({ code:200, message:"biomaster not initialized"});
				}
				next();
			});
	},

	symptomPlan: function( req, res, next ) {
		logger.trace("symptomPlan");

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				return beneficiaries.getHHR( req.session.beneficiary );
			})
			.then(function (beneficiary) {
				if (beneficiary.biomasterStatus) {
					return beneficiary.getSymptomsPlan();
				} else {
					return false;
				}
			})
			.then(function( result ) {
				logger.debug("end symptoms plan");
				if( result ) {
					res.send(result);
				} else {
					res.send({ code:200, message:"biomaster not initialized"});
				}
				next();
			});
	}
	
};

module.exports = IQueue;