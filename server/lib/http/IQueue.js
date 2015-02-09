/**
 * @file IBeneficiary.js
 * @module Http
 */

/* jslint node:true */
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
				})
		} catch(err) {
			res.send(400);
			return next(false);
		}
	}
};

module.exports = IQueue;