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

	/**
	 * send back a list of service items for agenda
	 * 
	 * The list is calculate for the next 40 days and start at the current date if no
	 * date is given by get parameters.
	 *
	 * a item of the list looks like :
	 * 
	 *       { 
	 *          serviceID: "56115e61ac182a071a26d404",
	 *          label: "SHOPHELP",
	 *          className: "event3",
	 *          start: "2015-10-15T11:00",
	 *          end: "2015-10-15T12:00",
	 *          provider: {
	 *              family: "",
	 *              given: ""
	 *          },
	 *          category: "HEALTH",
	 *          title: "",
	 *          frequency: "weekly"
	 *      }
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
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
				return _beneficiary.services().getServicesItems( startDate, 80, req.session.person.item.communication || physioDOM.lang );
			})
			.then( function(services) {
				res.send(services);
				next();
			})
			.catch( function(err) { errHandler(err, res, next); });
	},

	clearServicesQueueItems: function(req, res, next) {
		logger.trace("clearServicesQueueItems");

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function(_beneficiary) {
				return _beneficiary.services().clearServicesQueueItems();
			})
			.then( function() {
				res.send(200);
				next();
			})
			.catch( function(err) { errHandler(err, res, next); });
	},
	
	getServicesQueueItems: function( req, res, next ) {
		logger.trace("getServicesQueueItems");
		
		var startDate = req.params.startDate || moment().format("YYYY-MM-DD");
		var nbDays = req.params.nbDays || 15;
		var lang = req.params.lang || physioDOM.lang;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if (req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary);
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function(_beneficiary) {
				return _beneficiary.services().getServicesQueueItems( startDate, nbDays, lang );
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