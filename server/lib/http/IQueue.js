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
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("symptomPlan", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			var queue = new Queue(hhr);
			queue.init()
				.then(function (response) {
					res.send(200, { code:200, message:"init for "+ hhr +" sent"});
					next();
				})
				.catch(function (err) {
					logger.error("error ", err);
					res.send(err.code || 400, err);
					next(false);
				});
		}
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
	
	messages: function( req, res, next) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("messages", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.pushMessages();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end sending messages");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},
	
	history: function( req, res, next ) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("history", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.pushHistory(req.params.category);
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end sending history");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},
	
	dhdffq: function( req, res, next ) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("dhdffq", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.pushLastDHDFFQ();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end dhdffq");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},
	
	measurePlan: function( req, res, next ) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("measurePlan", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.getMeasurePlan();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end measure plan");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},

	symptomsSelf: function( req, res, next ) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("symptomsSelf", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.symptomsSelfToQueue();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end symptomsSelf");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},
	
	symptomPlan: function( req, res, next ) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("symptomPlan", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.getSymptomsPlan();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end symptoms plan");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},
	
	physicalPlan: function( req, res, next) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("physicalPlan", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.physicalPlanToQueue();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end physical plan");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},

	dietaryPlan: function( req, res, next) {
		var hhr = req.params.hhr?new ObjectID(req.params.hhr):null || req.session.beneficiary;
		logger.trace("dietaryPlan", hhr);

		if(!hhr) {
			res.send(404, { code:404, message:"empty hhr"});
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR(hhr);
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						return beneficiary.dietaryPlanToQueue();
					} else {
						return false;
					}
				})
				.then(function (result) {
					logger.debug("end dieatry plan");
					if (result) {
						res.send(result);
					} else {
						res.send({code: 200, message: "biomaster not initialized"});
					}
					next();
				});
		}
	},

	/**
	 * Receive a POST message from SServer
	 * 
	 * @param req  the POST request
	 * @param res  response object
	 * @param next restify callback
	 */
	receivedMsg: function( req, res, next ) {
		logger.trace("receivedMsg");
		
		try {
			var msg = JSON.parse(req.body.toString());
			var queue = new Queue( new ObjectID(msg.message.hhr) );
			queue.receivedMessages( msg )
				.then( function() {
					res.send(200, {code: 200, message: "received message type " + msg.type});
					next();
				})
				.catch( function(err) {
					logger.warning( err );
					res.send( 500 );
					next();
				});
		} catch( err ) {
			res.send(405, { code:405, message:"bad json format"});
			next();
		}
	}
	
};

module.exports = IQueue;