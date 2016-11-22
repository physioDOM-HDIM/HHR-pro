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
 * @file ICSV.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * ICSV
 * 
 * treat http request for CSV export
 * @type {exports}
 */
	
var Logger = require("logger"),
	Cookies = require("cookies"),
	swig = require("swig");
var logger = new Logger("ICSV");

var DOCUMENTROOT=require("path").join(__dirname,"../../../");


var ICSV = {
	/**
	 * retrieve directory list and send it as csv file
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getDirectory: function( req, res, next ) {
		logger.trace("getDirectory");
		var data = {};

		data.lang = physioDOM.lang;

		physioDOM.Directory()
			.then( function(directory) {
				return directory.getList();
			})
			.then( function(list) {
				data.directoryList = list;
				return physioDOM.Lists.getListArray('job');
			})
			.then( function(jobList) {
				data.jobList = jobList.items;
				return physioDOM.Lists.getListArray('organizationType');
			})
			.then(function(organizationTypeList) {
				data.organizationTypeList = organizationTypeList.items;

				swig.renderFile(DOCUMENTROOT+'/static/tpl/directory.csv', data, function(err, output) {
					res.setHeader('Content-disposition', 'attachment; filename=directory.csv');
					res.setHeader('Content-type', 'text/csv');

					//console.log(err);
					//console.log(output);

					res.send(output);
					next();
				});

			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});

	}
};

module.exports = ICSV;