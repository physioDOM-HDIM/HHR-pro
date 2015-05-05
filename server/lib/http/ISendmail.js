/**
 * @file IPage.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IList
 *
 * treat http request about lists
 */
var nodemailer = require('nodemailer'),
	path = require('path'),
    swig = require("swig"),
	Logger = require("logger"),
	RSVP = require("rsvp"),
	promise = RSVP.Promise,
	moment = require("moment");

var lang;
var DOCUMENTROOT=require("path").join(__dirname,"../../../");
var logger = new Logger("ISendmail");
var i18n;
var transporter = null;

var htmlTpl = DOCUMENTROOT + "/static/tpl/mailtpl.htm";
var textTpl = DOCUMENTROOT + "/static/tpl/mailtpl.txt";

if( physioDOM.config.smtp ) {
	transporter = nodemailer.createTransport(physioDOM.config.smtp);
}

function init(lang) {
	i18n = new(require('i18n-2'))({
		// setup some locales - other locales default to the first locale
		devMode: physioDOM.config.cache?false:true,
		// locales: ["en", "es", "nl", "fr"],
		locales: physioDOM.config.languages,
		extension:".json"
	});

	i18n.setLocale(lang);

	// swig.setDefaults( {cache: physioDOM.config.cache?'memory':false} );
	swig.setDefaults( { cache: false } );
	swig.setFilter("i18n", function (input, idx) {
		// console.log("input", input, idx);
		return i18n.__(input);
	});
}

function renderTpl ( tpl, data ) {
	return new promise( function( resolve, reject ) {
		swig.renderFile( tpl, data, function(err, output) {
			if(err) {
				console.log("Error",err);
				console.log(err.stack);
				reject(err);
			} else {
				resolve( output );
			}
		});
	});
}

var ISendmail  = {
	passwordMail : function( data ) {
		return new promise( function( resolve, reject ) {
			logger.trace("password mail");

			if( !transporter ) {
				logger.warning("no smtp transport defined");
				resolve();
			} else {
				init(data.lang);

				var promises = {
					html: renderTpl(htmlTpl, data),
					text: renderTpl(textTpl, data)
				};

				RSVP.hash(promises)
					.then(function (tpl) {
						
						var mailOptions = {
							from       : 'no-reply@telecomsante.com <no-reply@telecomsante.com>',
							to         : data.account.email,
							subject    : 'Physiodom account',
							text       : tpl.text,
							html       : tpl.html,
							attachments: [{
								filename: "physiodom_logo.png",
								path    : DOCUMENTROOT + "/logo/physiodom_logo.png",
								cid     : "logo@physiodom.eu" //same cid value as in the html img src
							}]
						};

						transporter.sendMail(mailOptions, function (error, info) {
							if (error) {
								logger.warning("email to " + data.account.email + " not delivered");
								console.log(error);
							} else {
								logger.info("email to " + data.account.email + " delivered");
							}
							resolve();
						});
					})
					.catch(function (err) {
						logger.warning(err);
						if (err.stack) {
							console.log(err.stack);
						}
						resolve();
					});
			}
		});
	}
}

module.exports = ISendmail;