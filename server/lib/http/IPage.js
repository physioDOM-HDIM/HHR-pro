/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IList
 *
 * treat http request about lists
 */

var swig = require("swig"),
	Logger = require("logger");
var logger = new Logger("IPage");
var i18n = new (require('i18n-2'))({
	// setup some locales - other locales default to the first locale
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
				html = swig.renderFile('./static/tpl/ui.htm', data);
				sendPage(html,res, next);
			});
	};
	
	this.directoryList = function(req, res, next) {
		logger.trace("Directory List");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};
		html = swig.renderFile('./static/tpl/directory.htm', data);
		sendPage(html,res, next);
	};

	this.directoryUpdate = function(req, res, next) {
		logger.trace("Directory update");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};
		physioDOM.Lists.getList("system", lang)
			.then( function(list) {
				data.system = list;
				return physioDOM.Lists.getList("use", lang);
			})
			.then( function(list) {
				data.use = list;
				return physioDOM.Lists.getList("role", lang);
			})
			.then( function(list) {
				if( list) { data.role = list; }
				return physioDOM.Lists.getList("job", lang);
			})
			.then( function(list) {
				if( list) { data.job = list; }
				return physioDOM.Lists.getList("communication", lang);
			})
			.then( function(list) {
				if (list) {
					data.communication = list;
				}
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
		
		html = swig.renderFile('./static/tpl/beneficiaryCreate.htm');
		sendPage(html,res, next);
	};

	this.beneficiarySelect = function(req, res, next) {
		logger.trace("beneficiarySelect");
		var html;
		
		init(req);
		var data = { 
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false 
		};
		try {
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
		} catch(err) {
			res.write(err);
			res.end();
			next();
		}
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
