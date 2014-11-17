/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IList
 *
 * treat http request about lists
 */

var swig = require("swig"),
	Logger = require("logger"),
	RSVP = require("rsvp");
var logger = new Logger("IPage");
var i18n = new (require('i18n-2'))({
	// setup some locales - other locales default to the first locale
	devMode:true,
	locales: ["en","es","nl","fr"]
});

function IPage() {
	var lang;
	
	function init(req) {
		lang = req.session.lang || req.cookies.lang || req.params.lang || "en"
		i18n.setLocale(lang);

		swig.setDefaults({cache: false});
		swig.setFilter('i18n', function (input, idx) {
			// console.log("input", input, idx);
			return i18n.__(input);
		});
	}
	
	this.ui = function( req, res, next ) {
		logger.trace("ui");
		var html;

		init(req);
		
		req.session.getPerson()
			.then( function( session ) {
				logger.debug("person",session.person);
				var data = {
					account: {
						firstname : session.person.item.name.given.slice(0, 1).toUpperCase(),
						lastname : session.person.item.name.family
					} 
				};
				html = swig.renderFile('./static/tpl/ui.htm', data, function (err, output) {
					if (err) {
						   console.log("error", err);
						   console.log("output", output);
						   res.write(err);
						   res.end();
						   next();
					   } else {
						   sendPage(output, res, next);
					   }
				});
			});
	};

	function promiseList(listName) {
		return physioDOM.Lists.getList(listName, lang)
			.then( function(list) {
				var result = {};
				result[listName] = list;
				return result;
			})
			.catch(function() {
				var result = {};
				result[listName] = {};
				return result;
			});
	}
	
	this.directoryList = function(req, res, next) {
		logger.trace("Directory List");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		var promises = [
			"perimeter"
		].map( promiseList);

		RSVP.all(promises)
			.then( function(lists) {
				lists.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});
				html = swig.renderFile('./static/tpl/directory.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	this.directoryUpdate = function(req, res, next) {
		logger.trace("Directory update");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};
		
		var promises = [
			"system",
			"role",
			"job",
			"communication"
		].map( promiseList);
		
		RSVP.all(promises)
			.then( function(lists) {
				lists.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});
				return physioDOM.Directory();
			})
			.then(function(directory) {
				return directory.getAdminEntryByID( req.params.professionalID );
			})
			.then( function(professional) {
				logger.debug("data", data);
				logger.debug("prof ", professional );
				if( professional) {
					data.professional = professional;
				}
				html = swig.renderFile('./static/tpl/directoryUpdate.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};
	
	this.beneficiaryCreate = function(req, res, next) {
		logger.trace("beneficiaryCreate");
		var html;
		
		init(req);

		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		var promises = [
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"communication",
			"profession",
			"perimeter"
		].map( promiseList);

		RSVP.all(promises)
			.then( function(lists) {
				lists.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryAdminByID( req.session, req.params.beneficiaryID );
			})
			.then( function(beneficiary) {
				logger.debug("data", data);
				logger.debug("bene ", beneficiary );
				if( beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary.getProfessionals();
				}
				return null;
			}).then(function(professionals){
				if( professionals ){
					data.beneficiary.professionals = professionals;
				}

				html = swig.renderFile("./static/tpl/beneficiaryCreate.htm", data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	this.beneficiarySelect = function(req, res, next) {
		logger.trace("beneficiarySelect");
		var html;
		
		init(req);
		var data = { 
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false 
		};
		physioDOM.Lists.getList("perimeter", lang)
			.then( function(list) {
				if (list) {
					data.perimeter = list;
				}
				
				html = swig.renderFile('./static/tpl/beneficiaries.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	this.beneficiaryOverview = function(req, res, next) {
		logger.trace("beneficiaryOverview");
		var html;
		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};
		try {
			html = swig.renderFile('./static/tpl/recipientDetail.htm', data, function (err, output) {
				if (err) {
					console.log("error", err);
					console.log("output", output);
					res.write(err);
					res.end();
					next();
				} else {
					sendPage(output, res, next);
				}
			});
		} catch(err) {
			res.write(err);
			res.end();
			next();
		}
		/*
		var data = {};
		var html = swig.renderFile('./static/tpl/recipientDetail.htm', data);
		sendPage(html, req, res, next);
		*/
	};
	
	function sendPage( html, res, next ) {
		logger.trace("sendPage");
		res.writeHead(200, {
			'Content-Length': Buffer.byteLength(html),
			'Content-Type'  : 'text/html'
		});

		res.write(html);
		res.end();
		next();
	}
}

module.exports = new IPage();
