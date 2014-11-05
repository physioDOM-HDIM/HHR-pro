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
	
	function init(req) {
		i18n.setLocale(req.cookies.lang || req.params.lang || "en");

		swig.setDefaults({cache: false});
		swig.setFilter('i18n', function (input, idx) {
			console.log("input", input, idx);
			return i18n.__(input);
		});
	}
	
	this.beneficiaryCreate = function(req, res, next) {
		logger.trace("beneficiaryCreate");
		var html;
		
		//init(req);
		i18n.setLocale(req.cookies.lang || req.params.lang || "en");

		swig.setDefaults({cache: false});
		swig.setFilter('i18n', function (input, idx) {
			console.log("input", input, idx);
			return i18n.__(input);
		});
		
		html = swig.renderFile('./static/tpl/beneficiaryCreate.htm');
		// html = swig.renderFile('./static/tpl/beneficiaries.htm');
		
		res.writeHead(200, {
			'Content-Length': Buffer.byteLength(html),
			'Content-Type'  : 'text/html'
		});
		res.write(html);
		res.end();
		next();
	};

	this.beneficiarySelect = function(req, res, next) {
		logger.trace("beneficiarySelect");
		var html;
		
		i18n.setLocale(req.cookies.lang || req.params.lang || "fr");
		
		swig.setDefaults({cache: false});
		swig.setFilter('i18n', function (input, idx) {
			console.log("input", input, idx);
			return i18n.__(input);
		});
		
		var data = { 
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false 
		}
		html = swig.renderFile('./static/tpl/beneficiaries.htm', data);
		
		res.writeHead(200, {
			'Content-Length': Buffer.byteLength(html),
			'Content-Type'  : 'text/html'
		});
		
		res.write(html);
		res.end();
		next();
	};
}

module.exports = new IPage();