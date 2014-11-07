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
	promise = require("RSVP").Promise;
var logger = new Logger("IPage");
var i18n = new (require('i18n-2'))({
	// setup some locales - other locales default to the first locale
	locales: ["en","es","nl","fr"]
});

swig.setDefaults({cache: false});
swig.setFilter('i18n', function (input, idx) {
	console.log("input", input, idx);
	return i18n.__(input);
});

function IPage() {
	
	function init(req) {
		i18n.setLocale(req.cookies.lang || req.params.lang || "en");
	}
	
	this.beneficiaryCreate = function(req, res, next) {
		logger.trace("beneficiaryCreate");
		init(req);
		var html = swig.renderFile('./static/tpl/beneficiaryCreate.htm');
		sendPage(html,req, res, next );
	};

	this.beneficiarySelect = function(req, res, next) {
		logger.trace("beneficiarySelect");
		init(req);
		var data = { 
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false 
		};
		var html = swig.renderFile('./static/tpl/beneficiaries.htm', data);
		sendPage(html, req, res, next );
	};
	
	this.beneficiaryOverview = function(req, res, next) {
		logger.trace("beneficiaryOverview");
		init(req);
		var data = {};
		var html = swig.renderFile('./static/tpl/recipientDetail.htm', data);
		sendPage(html, req, res, next);
	};
	
	function sendPage( content , req, res, next) {
		res.writeHead(200, {
			'Content-Length': Buffer.byteLength(content),
			'Content-Type'  : 'text/html'
		});
	
		res.write(content);
		res.end();
		next();
	}
}

module.exports = new IPage();