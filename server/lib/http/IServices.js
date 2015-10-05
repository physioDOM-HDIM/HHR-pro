/**
 * @file IServcies.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

/**
 * IDirectory
 *
 * treat http request for the directory
 * @type {exports}
 */

var Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Promise = require("rsvp").Promise,
	moment = require("moment");
var logger = new Logger("IServices");

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

var IServices = {
	
	getServices: function( req, res, next ) {
		logger.trace("getServices");
		
		var category = req.params.category || null;
		var active = req.params.active==="true"?true:false;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function(_beneficiary) {
				return _beneficiary.services().getServices(category, active);
			})
			.then( function(services) {
				res.send(services);
				next();
			})
			.catch( function(err) { console.log("err!"); errHandler(err, res, next); } );
	},
	
	getServicesItems: function( req, res, next ) {
		logger.trace("getServicesItems");
		
		var startDate = req.params.startDate || moment().format("YYYY-MM-DD");

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function(_beneficiary) {
				return _beneficiary.services().getServicesItems( startDate, 40, "fr" );
			})
			.then( function(services) {
				res.send(services);
				next();
			})
			.catch( function(err) { errHandler(err, res, next); });
	},
	
	getServiceByID: function(req, res, next) {
		logger.trace("getServiceByID", req.params.serviceID);

		var serviceID = new ObjectID(req.params.serviceID);
		var beneficiary, service;
		
		if( !serviceID ) {
			throw { code:405, message:"no serviceID given" };
		}
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function(_beneficiary) {
				beneficiary = _beneficiary;
				return _beneficiary.services().getServiceByID(serviceID);
			})
			.then( function(_service) {
				service = _service;
				var listName = service.category.toLowerCase() + "Services";
				return physioDOM.Lists.getListArray(listName);
			})
			.then( function(listServices) {
				service.refLabel = listServices.items[service.ref];
				res.send(service);
				next();
			})
			.catch( function(err) { console.log("err!"); errHandler(err, res, next); } );
	},
	
	putService: function(req, res, next) {
		logger.trace("putService");
		
		var beneficiary, serviceObj, service;
		try {
			serviceObj = JSON.parse(req.body);
			
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					if (req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary);
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then( function(_beneficiary) {
					beneficiary = _beneficiary;
					return _beneficiary.services().putService(serviceObj, req.session.person.id);
				})
				.then( function( obj ) {
					console.log("service put ", obj);

					var log = {
						subject   : beneficiary._id,
						datetime: moment().toISOString(),
						source  : req.session.person.id,
						collection: "services",
						action    : obj.create ? "create" : "update",
						what      : obj
					};
					physioDOM.db.collection("journal").save(log, function (err) {
						if (err) {
							logger.warning("error when writing to journal ", err);
						}
					});
					return obj.getDetail();
				})
				.then( function(service) {
					res.send( service );
					next();
				})
				.catch( function(err) {
					if( err.stack ) { console.log( err.stack ); }
					res.send(err.code || 400, err);
					next(false);
				});
		} catch( err ) {
			res.send(err.code || 400, err);
			next(false);
		}
	},

	/**
	 * depending if some benefit has been provided, the service is deactivate, else
	 * it could be removed
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	removeService: function(req, res, next) {
		logger.trace("removeServiceD", req.params.serviceID);
		var beneficiary;
		var serviceID = req.params.serviceID;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function(_beneficiary) {
				beneficiary = _beneficiary;
				return _beneficiary.services().deactivate( new ObjectID(serviceID), req.session.person.id);
			})
			.then( function( service ) {
				var log = {
					subject   : beneficiary._id,
					datetime: moment().toISOString(),
					source  : req.session.person.id,
					collection: "services",
					action    : "delete",
					what      : {_id: new ObjectID(req.params.serviceID)}
				};
				physioDOM.db.collection("journal").save(log, function () {
					// res.send(200, {code: 200, message: "service successfully deactivated"});
					res.send( service );
					next();
				});
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	}
};

module.exports = IServices;