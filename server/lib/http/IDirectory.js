/**
 * @file IDirectory.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IDirectory
 * 
 * treat http request for the directory
 * @type {exports}
 */
	
var Logger = require("logger"),
	promise = require("rsvp").Promise,
	Cookies = require("cookies");
var logger = new Logger("IDirectory");

/**
 * IDirectory
 *
 * treat http request for the directory
 * 
 * @type {object}
 */
var IDirectory = {
	/**
	 * retrieve directory entry and send it as json object
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getEntries: function( req, res, next ) {
		logger.trace("getEntries");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 10;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;
		
		physioDOM.Directory()
			.then( function(directory) {
				return directory.getEntries(pg, offset, sort, sortDir, filter);
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
	/**
	 * Create a new entry in the directory
	 * the new entry to be create is given in the body of a POST request in JSON
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	createEntry: function(req, res, next ) {
		logger.trace("createEntry");

		physioDOM.Directory()
			.then( function(directory) {
				if(!req.body) {
					throw( {"message":"entry is empty"});
				}try {
					var user = JSON.parse(req.body.toString());
					return directory.createEntry(user);
				} catch(err) {
					throw { code:405, message:"bad json format"};
				}
			})
			.then( function(entry) {
				res.send(entry);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	getEntry: function(req, res, next) {
		physioDOM.Directory()
			.then( function(directory) {
				return directory.getEntryByID(req.params.entryID);
			})
			.then( function(professional) {
				res.send( professional );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	updateEntry: function(req, res, next) {
		if(!req.body) {
			res.send(400, { error: "empty request"});
			return next(false);
		}
		// console.log( req.getContentType() );
		try {
			var item = JSON.parse(req.body);
		} catch( err ) {
			res.send(400, { error: "bad json format"});
			next(false);
		} finally {
			physioDOM.Directory()
				.then(function (directory) {
					return directory.getEntryByID(req.params.entryID);
				})
				.then(function (professional) {
					return professional.update( item );
				})
				.then(function (professional) {
					if ( req.session.person.id.toString() == professional._id.toString() ) {
						req.session.lang = professional.communication || physioDOM.lang;
						var cookies = new Cookies(req, res);
						cookies.set('lang',physioDOM.lang, { path: '/', httpOnly : false});
					}
					res.send(professional);
					next();
				})
				.catch(function (err) {
					res.send(err.code || 400, err);
					next(false);
				});
		}
	},
	
	deleteEntry: function(req, res, next) {
		physioDOM.Directory()
			.then( function(directory) {
				return directory.deleteEntry(req.params.entryID);
			})
			.then( function() {
				res.send(410, { error: "entry deleted"});
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * adds account information to a directory entry
	 * the directory entry is given by req.params.entryID
	 * 
	 * request POST /api/directory/:entryID/account
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	accountUpdate: function(req, res, next) {
		var professional;
		
		try {
			var account = JSON.parse(req.body);
		} catch( err ) {
			res.send(400, { error: "bad json format"});
			next(false);
		} finally {
			physioDOM.Directory()
				.then(function (directory) {
					return directory.getEntryByID(req.params.entryID);
				})
				.then(function (_professional) {
					professional = _professional;
					if( req.headers["ids-user"] && !account.login ) {
						account.login = professional.getEmail();
					}
					return professional.accountUpdate(account, req.session.person.id.toString() !== professional._id.toString() );
				})
				.then( function(professional, OTP) {
					return new promise( function( resolve, reject) {
						logger.info("account updated");
						if( !OTP && req.headers["ids-user"]) {
							logger.alert( "create cert" );
							professional.createCert( req, res )
								.then( resolve )
								.catch( reject );
						} else {
							professional.getAccount()
								.then( resolve );
						}
					});
				})
				.then( function(_account) {
					if( req.session.person.id.toString() !== professional._id.toString() && account.password !== _account.password ) {
						var data = {
							account : _account,
							password: account.password,
							server  : physioDOM.config.server,
							lang: professional.communication
						};
						if (req.headers["ids-user"]) {
							data.idsUser = true;
						}
						return require("./ISendmail").passwordMail( data );
					}
				})
				.then( function() {
					res.send(professional);  // updated professional
					next();
				})
				.catch(function (err) {
					logger.error( err.stack );
					res.send(400, { code:400, messages: err.error });
					next(false);
				});
		}
	},

	/**
	 * Get account information of a professional
	 * 
	 * request GET /api/directory/:entryID/account
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	account: function(req, res, next) {
		physioDOM.Directory()
			.then(function (directory) {
				return directory.getEntryByID(req.params.entryID);
			})
			.then(function(professional) {
				return professional.getAccount();
			})
			.then( function(account) {
				res.send(account);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err );
				next(false);
			});
	},

	createCert: function (req, res, next) {
		logger.trace("createCert");

		var professional;
		
		physioDOM.Directory()
			.then(function (directory) {
				return directory.getEntryByID(req.params.entryID);
			})
			.then(function (_professional) {
				professional = _professional;
				return professional.getAccount();
			})
			.then( function(account) {
				if(account.OTP) {
					logger.info("revoke cert first");
				}
				return professional.createCert(req, res );
			})
			.then(function ( account ) {
				logger.info("receive account", account );
				res.send( account );
				next();
			})
			.catch(function(err) {
				logger.warning("Error when creating certificate");
				logger.warning(err.stack);
				res.send(400, { code:400, message:"Error when creating certificate"});
				next(false);
			});
	},

	revoqCert: function (req, res, next) {
		logger.trace("revoqCert");

		var professional;

		physioDOM.Directory()
			.then(function (directory) {
				return directory.getEntryByID(req.params.entryID);
			})
			.then(function ( _professional ) {
				professional = _professional;
				return professional.getAccount();
			})
			.then( function(account) {
				return professional.revokeCert(req, res );
			})
			.then(function ( account ) {
				logger.info("receive account", account );
				res.send( account );
				next();
			})
			.catch(function(err) {
				logger.warning("Error certificate revocation");
				logger.warning(err.stack);
				res.send(400, { code:400, message:"Error certificate revocation"});
				next(false);
			});
	}
};

module.exports = IDirectory;