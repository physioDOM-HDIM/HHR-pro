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
		
		var queue = new Queue( req.session );
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
		try {
			var msg = JSON.parse(req.body.toString());
			logger.debug("status msg :", msg );
			var search = { _id: new ObjectID( msg.subject) };
			var update = { '$set': { "biomasterStatus": msg.status } };
			logger.debug(search, update );
			physioDOM.db.collection('beneficiaries').update( search, update , function( err, nb) {
				if(err) {
					res.send(500, err);
					next(false);
				} else {
					logger.debug("status",nb);
					res.send(200);
					next();
				}
			} );
			
		} catch(err) {
			res.send(400);
			return next(false);
		}
	}
};

module.exports = IQueue;