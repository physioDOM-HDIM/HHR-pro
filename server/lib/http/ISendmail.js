/**
 * @file ISendmail.js
 * @module sendmail
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var email = require("emailjs"),
	path = require('path'),
    swig = require("swig"),
	Logger = require("logger"),
	RSVP = require("rsvp"),
	promise = RSVP.Promise;

var DOCUMENTROOT=require("path").join(__dirname,"../../../");
var logger = new Logger("ISendmail");
var i18n;
var transporter = null;

var htmlTpl = path.join( DOCUMENTROOT , "static/tpl/mailtpl.htm");
var textTpl = path.join( DOCUMENTROOT , "static/tpl/mailtpl.txt");

if( physioDOM.config.smtp ) {
	transporter = email.server.connect(physioDOM.config.smtp);
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

/**
 * ISendmail
 * 
 * @type {{passwordMail: Function}}
 */
var ISendmail  = {
	/**
	 * passwordMail
	 * 
	 * Send a email with the temporary password,
	 * and if the site is hosted on the IDS infrastructure, the email given data to obtain the certificate
	 * 
	 * @param data
	 * @returns {RSVP.Promise}
	 */
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
						transporter.send({
							from      : "physiodom <no-reply@physiodom.eu>",
							to        : data.account.email,
							subject   : 'Physiodom account',
							text      : tpl.text,
							attachment: [
								{
									data: tpl.html,
									alternative: true,
									related: [
										{
											path : path.join(__dirname , "../../../static/img/physiodom_logo.png"),
											type : "image/png",
											name: "physiodom_logo.png",
											headers: { "Content-ID":"<logo@physiodom.eu>" }
										}
									]
								}
							]
						}, function(err, message) {
							if(err) {
								console.log("Error ",err);
							} else {
								console.log(message);
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
	},

	/**
	 * certificateMail
	 *
	 * Send a email with the urk to retrieve the certificate
	 *
	 * @param data
	 * @returns {RSVP.Promise}
	 */
	certificateMail : function( data ) {
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
						transporter.send({
							from      : "physiodom <no-reply@physiodom.eu>",
							to        : data.account.email,
							subject   : 'Physiodom account',
							text      : tpl.text,
							attachment: [
								{
									data: tpl.html,
									alternative: true,
									related: [
										{
											path : path.join(__dirname , "../../../static/img/physiodom_logo.png"),
											type : "image/png",
											name: "physiodom_logo.png",
											headers: { "Content-ID":"<logo@physiodom.eu>" }
										}
									]
								}
							]
						}, function(err, message) {
							if(err) {
								console.log("Error ",err);
							} else {
								console.log(message);
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
	},

	/**
	 * certificateRevoqMail
	 *
	 * Send a email with the urk to retrieve the certificate
	 *
	 * @param data
	 * @returns {RSVP.Promise}
	 */
	certificateRevoqMail : function( data ) {
		return new promise( function( resolve, reject ) {
			logger.trace("password mail");

			if( !transporter ) {
				logger.warning("no smtp transport defined");
				resolve();
			} else {
				init(data.lang);

				htmlTpl = path.join( DOCUMENTROOT , "static/tpl/mailRevoqTpl.htm");
				textTpl = path.join( DOCUMENTROOT , "static/tpl/mailRevoqTpl.txt");
				
				var promises = {
					html: renderTpl(htmlTpl, data),
					text: renderTpl(textTpl, data)
				};

				RSVP.hash(promises)
					.then(function (tpl) {
						transporter.send({
							from      : "physiodom <no-reply@physiodom.eu>",
							to        : data.account.email,
							subject   : 'Physiodom account',
							text      : tpl.text,
							attachment: [
								{
									data: tpl.html,
									alternative: true,
									related: [
										{
											path : path.join(__dirname , "../../../static/img/physiodom_logo.png"),
											type : "image/png",
											name: "physiodom_logo.png",
											headers: { "Content-ID":"<logo@physiodom.eu>" }
										}
									]
								}
							]
						}, function(err, message) {
							if(err) {
								console.log("Error ",err);
							} else {
								console.log(message);
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
};

module.exports = ISendmail;