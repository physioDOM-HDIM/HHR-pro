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
	
	getServiceByID: function(req, res, next) {
		logger.trace("getServiceByID");

		var serviceID = req.params.serviceID || null;
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
				return physioDOM.Directory();
			})
			.then( function(Directory) {
				var promises = [service.provider, service.source].map(function (professionalID) {
					return Directory.getEntryByID(professionalID);
				});
				
				return Promise.all(promises);
			})
			.then( function( professionals ) {
				service.providerName = professionals[0].name;
				service.sourceName = professionals[1].name;
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
			
			console.log( serviceObj );
			
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
					service = obj.service;
					var log = {
						subject: beneficiary._id,
						datetime: moment().toISOString(),
						source: req.session.person.id,
						collection: "services",
						action: obj.create?"create":"update",
						what: obj.service
					};
					physioDOM.db.collection("journal").save( log, function( err ) { 
						if(err) {
							logger.warning( "error when writing to journal ", err );
						}
					});

					return physioDOM.Directory();
				})
				.then( function(Directory) {
					return Directory.getEntryByID( service.source );
				})
				.then( function(professional) {
					service.sourceName = professional.name;
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
		logger.trace("removeServiceD");
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
				return _beneficiary.services().removeService(serviceID);
			})
			.then( function( done ) {
				if( done ) {
					var log = {
						subject   : beneficiary._id,
						datetime: moment().toISOString(),
						source  : req.session.person.id,
						collection: "services",
						action    : "delete",
						what      : {_id: new ObjectID(req.params.serviceID)}
					};
					physioDOM.db.collection("journal").save(log, function () {
						res.send(200, {code: 200, message: "service successfully deleted"});
						next();
					});
				} else {
					res.send(404, {code: 404, message: "service not found"});
					next();
				}
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	}
};

module.exports = IServices;