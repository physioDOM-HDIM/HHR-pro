/**
 * @file IBeneficiary.js
 * @module Http
 */

/* jslint node:true */
"use strict";

var Logger = require("logger");
var logger = new Logger("IBeneficiary");

/**
 * IBeneficiaries
 *
 * treat http request for beneficiaries
 */
var IBeneficiary = {

	/**
	 * get list of beneficiaries
	 * 
	 * Nota : Session must exists
	 */
	getBeneficiaries : function( req, res, next ) {
		logger.trace("getBeneficiaries");
		// logger.debug(req.session?"session "+ JSON.stringify(req.session,null,4) : "no session");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;

		// console.log(req.Session);
		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaries(req.session, pg, offset, sort, sortDir, filter);
			})
			.then( function(list) {
				res.send(list);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	createBeneficiary: function(req, res, next ) {
		logger.trace("createBeneficiary");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				if(!req.body) {
					throw( {"message":"entry is empty"});
				}
				try {
					var user = JSON.parse(req.body.toString());
					return beneficiaries.createBeneficiary(req.session, user);
				} catch(err) {
					throw { code:405, message:"bad json format"};
				}
			})
			.then( function(beneficiary) {
				res.send(beneficiary);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getBeneficiary: function(req, res, next) {
		logger.trace("getBeneficiary");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID);
			})
			.then( function(beneficiary) {
				res.send( beneficiary );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	updateBeneficiary: function(req, res, next) {
		logger.trace("updateBeneficiary");
		if(!req.body) {
			res.send(400, { error: "empty request"});
			return next(false);
		}
		if( ["administrator","coordinator"].indexOf(req.session.role) === -1 ) {
			res.send(403,  { code:403, message:"not authorized"});
			return next(false);
		}
		try {
			var updateItem = JSON.parse(req.body);
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID);
				})
				.then(function (beneficiary) {
					return beneficiary.update(updateItem);
				})
				.then( function (beneficiary ) {
					res.send( beneficiary );
					next();
				})
				.catch(function (err) {
					res.send(err.code || 400, err);
					next(false);
				});
		} catch( err ) {
			res.send(400, { error: "bad json format"});
			next(false);
		}
	},

	deleteBeneficiary: function(req, res, next) {
		logger.trace("deleteBeneficiary");
		var beneficiaries;
		
		physioDOM.Beneficiaries()
			.then( function( _beneficiaries) {
				beneficiaries = _beneficiaries;
				return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID);
			})
			.then( function(beneficiary) {
				if( ["administrator","coordinator"].indexOf(req.session.role) === -1 ) {
					throw { code:403, message:"not authorized"};
				} else {
					return beneficiaries.deleteBeneficiary(beneficiary);
				}
			})
			.then( function() {
				res.send(410, { code:410, message: "entry deleted"});
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	beneficiaryProfessionals: function(req, res, next) {
		logger.trace("beneficiaryProfessonnals");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID);
			})
			.then( function(beneficiary) {
				return beneficiary.getProfessionals( pg, offset );
			})
			.then( function( professionals ) {
				res.send( professionals );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	beneficiaryAddProfessional: function(req, res, next) {
		logger.trace("beneficiaryAddProfessonnal");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID);
			}).then( function(beneficiary) {
				logger.debug("get beneficiary");
				var item;
				try {
					item = JSON.parse(req.body);
					if( Array.isArray(item)) {
						return beneficiary.addProfessionals(item);
					} else {
						return beneficiary.addProfessional(item.professionalID, item.referent);
					}
				} catch( err ) {
					var error = err;
					if(!error) {
						error = { code:405, message:"bad format"};
					}
					res.send(error.code || 400, error);
					next(false);
				}
			})
			.then( function(professionals) {
				res.send( professionals );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	beneficiaryDelProfessional: function(req, res, next) {
		logger.trace("beneficiaryDelProfessonnal");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID);
			}).then( function(beneficiary) {
				return beneficiary.delProfessional(req.params.profID);
			})
			.then( function(professionals) {
				res.send( professionals );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	}
};

module.exports = IBeneficiary;