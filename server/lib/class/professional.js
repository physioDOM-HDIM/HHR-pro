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
 * @file professionals.js
 * @module Directory
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	directorySchema = require("./../schema/directorySchema"),
	soap = require("soap"),
	Cookies = require("cookies"),
	moment = require("moment"),
	md5 = require('md5');

var logger = new Logger("Professional");

function capitalize(str) {
	return str.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
}

/**
 * A professional entry in the directory
 * 
 * @constructor
 */
function Professional() {
	/**
	 * Get the profesionnal entry known by its ID
	 * 
	 * onsuccess the promise return the professional object,
	 * else return an error ( code 404 )
	 * 
	 * @param professionalID
	 * @returns {promise}
	 */
	this.getById = function( professionalID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getById", professionalID);
			physioDOM.db.collection("professionals").findOne({_id: professionalID }, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"not found"});
				} else {
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					that.getBeneficiariesCount()
						.then( function(nb) {
							that.nb = nb;
							resolve(that);
						});
				}
			});
		});
	};
	
	this.getBeneficiariesCount = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			physioDOM.db.collection("beneficiaries").count( { 'professionals.professionalID' : that._id.toString() }, function(err, nb ) {
				resolve(nb);
			});
		});
	}

	/**
	 * Special Access for creating/updating an entry
	 * 
	 * Get the professional records with its account information
	 * 
	 * @param professionalID
	 * @returns {promise}
	 */
	this.getAdminById = function( professionalID ) {
		logger.trace("getAdminById", professionalID);
		var that = this;
		return new promise( function(resolve, reject) {
			var result = { };
			that.getById(professionalID)
				.then(function (professional) {
					result = professional;
					return professional.getAccount();
				})
				.then( function(account) {
					result.account = account;
					result.hasPassword = (account.password !== undefined && account.password !== "");
					resolve(result);
				})
				.catch( function( err ) {
					logger.warning("error",err);
					resolve(result);
				});
		});
	};

	/**
	 * Save the professional in the database
	 * 
	 * the promise return the object completed with the _id property for new record.
	 * 
	 * @returns {promise}
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save");
			delete that.nb;
			physioDOM.db.collection("professionals").save( that, function(err, result) {
				if(err) { throw err; }
				if( isNaN(result)) {
					that._id = result._id;
				}
				that.getBeneficiariesCount()
					.then( function(nb) {
						that.nb = nb;
						resolve(that);
					});
			});
		});
	};

	/**
	 * Check that the entry is unique
	 * 
	 * The unicity is given by the email address
	 * Two professionals cannot share the same email address
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkUniq( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkUniq");
			// check that the entry have an email
			var email = false;
			entry.telecom.forEach( function( contact , i ) {
				if(contact.system === "email") {
					email = contact.value ;
				}
			});
			var filter = { telecom: { system:"email", value:email } };
			if( entry._id ) {
				filter._id = { "$ne": new ObjectID(entry._id) };
			}
			physioDOM.db.collection("professionals").count( filter , function(err,nb) {
				if(err) {
					logger.error(err);
					reject(err);
				}
				if(nb > 0) {
					logger.warning("duplicate");
					reject({error:"duplicate"});
				} else {
					resolve( entry );
				}
			});
		});
	}

	/**
	 * Check that the entry is a valid professional
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkSchema( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = directorySchema.validator.validate( entry, { "$ref":"/Professional"} );
			if( check.errors.length ) {
				if( entry.organization ) {
					check = directorySchema.validator.validate( entry, { "$ref":"/Organization"} );
				} else {
					check = directorySchema.validator.validate( entry, { "$ref":"/Practitioner"} );
				}
				return reject( {error:"bad format", detail: check.errors} );
			} else {
				return resolve(entry);
			}
		});
	}

	/**
	 * Initialize the professional object with an object
	 * 
	 * the promise will return the record saved in the database
	 * 
	 * @param newEntry
	 * @returns {promise}
	 */
	this.init = function( newEntry, professionalID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("init");
			
			checkSchema( newEntry )
				.then( checkUniq )
				.then( function(entry) {
					return new promise( function( resolve, reject) {
						for (var key in newEntry) {
							if (newEntry.hasOwnProperty(key)) {
								switch (key) {
									case "name":
										that.name = newEntry.name;
										that.name.family = capitalize(that.name.family);
										that.name.given = capitalize(that.name.given);
										break;
									default:
										that[key] = newEntry[key];
								}
							}
						}
						var search = {
							telecom: {
								'$elemMatch': {
									system: "email",
									value : that.getEmail()
								}
							},
							_id    : {
								'$ne': that._id
							}
						};
						that.source = professionalID;
						that.datetime = moment().toISOString();
						
						physioDOM.db.collection("professionals").count(search, function (err, nb) {
							if (nb === 0) {
								that.save()
									.then(resolve)
									.catch(reject);
							} else {
								logger.warning("email address already used", that.getEmail());
								reject({code: 405, message: "email address already used"});
							}
						});
					});
				})
				.then( resolve )
				.catch( reject );
		});
	};

	/**
	 * Get the list of beneficiaries attached to the current professional
	 * 
	 * @param pg
	 * @param offset
	 * @returns {promise}
	 */
	this.getBeneficiaries = function(pg, offset) {
		// depending of the role of the professional
		// if admin or coordinators : all beneficiaries
		// if other only list of declared beneficiary
		//var that = this;
		return new promise( function( resolve, reject ) {
			// db.benefici
		});
	};

	/**
	 * update the current object with the given updatedItem
	 * 
	 * the promise return the updated object
	 * 
	 * @param {object} updatedItem
	 * @returns {promise}
	 */
	this.update = function( updatedItem, professionalID) {
		var that = this;
		return new promise( function( resolve, reject ) {
			logger.trace("update");
			if ( updatedItem._id !== that._id.toString()) {
				return reject({ error : "update bad id"});
			}
			updatedItem._id = new ObjectID(updatedItem._id);
			if ( updatedItem.account && updatedItem.account !== that.account.toString()) {
				return reject({ error : "update bad account"});
			}
			updatedItem.account = new ObjectID(updatedItem.account);
			checkSchema( updatedItem )
				.then( checkUniq )
				.then( function(entry) {
					return new promise( function( resolve, reject) {
						var key;
						for (key in entry) {
							if (entry.hasOwnProperty(key) && ["_id", "account"].indexOf(key) === -1) {
								that[key] = entry[key];
								switch (key) {
									case "name":
										if (that.name.family) {
											that.name.family = capitalize(that.name.family);
										}
										if (that.name.given) {
											that.name.given = capitalize(that.name.given);
										}
										break;
									default:
								}
							}
						}

						for (key in that) {
							if (that.hasOwnProperty(key) && typeof that[key] !== "function" && !entry.hasOwnProperty(key)) {
								delete that[key];
							}
						}
						var search = {
							telecom: {
								'$elemMatch': {
									system: "email",
									value : that.getEmail()
								}
							},
							_id    : {
								'$ne': that._id
							}
						};
						that.source = professionalID;
						that.datetime = moment().toISOString();
						physioDOM.db.collection("professionals").count(search, function (err, nb) {
							if (nb === 0) {
								that.save()
									.then( resolve )
									.catch( reject );
							} else {
								logger.warning("email address already used", that.getEmail() );
								reject({code: 405, message: "email address already used"});
							}
						});
					});
				})
				.then( function(professional) {
					return professional.getAccount();
				})
				.then( function(account) {
					var modified = false;
					if( account.hasOwnProperty("active") && account.active !== that.active ) {
						modified = true;
						logger.debug("update account active flag");
						account.active = that.active;
					}
					if ( account.hasOwnProperty("role") && account.role !== that.role) {
						modified = true;
						account.role = that.role;
					}
					if( modified ) {
						physioDOM.db.collection("account").save(account, function (err, result) {
							if(err) { throw err; }
							resolve(that);
						});
					} else {
						resolve(that);
					}
				})
				.catch( reject );
		});
	};

	/**
	 * return account information about the professional
	 * 
	 * the promise resolve with account information as object,
	 * if no account information is found the resolve return an empty object
	 * 
	 * @returns {promise}
	 */
	this.getAccount = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			var search = { "person.id": that._id };
			physioDOM.db.collection("account").findOne( search, function( err, item ) {
				if(err) {
					throw err;
				} else {
					resolve(item || {});
				}
			});
		});
	};

	this.getEmail = function() {
		var email = "";
		this.telecom.forEach( function(item) {
			if( !email && item.system === "email") {
				email = item.value;
			}
		});
		return email;
	};
	
	/**
	 * @method accountUpdate
	 * 
	 * update account information of the professional, resolve with the updated object
	 * 
	 * @param accountData
	 * @returns {promise}
	 */
	this.accountUpdate = function( accountData, firstlogin ) {
		var that = this;
		
		function checkUniqLogin() {
			return new promise( function(resolve, reject) {
				physioDOM.db.collection("account").count( { login: accountData.login.toLowerCase(), 'person.id': {'$ne': that._id }}, function (err, count) {
					resolve( count );
				});
			});
		}
		
		return new promise( function(resolve, reject) {
			logger.trace( "accountUpdate" );
			checkUniqLogin()
				.then( function(count) {
					if(count) {
						var err = { code:409, message:"login already used" };
						if( accountData.IDS==="true" ) {
							err = { code:409, message:"email already used" };
						}
						logger.warning("error", err );
						throw err;
					} else {
						return that.getAccount();
					}
				})
				.then( function(account) {
					logger.trace("account", accountData );
					if ( accountData.IDS==="true" && account.login ) {
						// keep the old login if exists
						accountData.login = account.login;
					}
					if (!(accountData.login || accountData.IDS==="true" ) || !accountData.password) {
						return reject({error: "account data incomplete"});
					}
					var newAccount = {
						login   : accountData.login.toLowerCase(),
						password: accountData.password === account.password?account.password:md5(accountData.password),
						active  : that.active,
						role    : that.role,
						email   : that.getEmail(),
						firstlogin: firstlogin,
						person  : {
							id        : that._id,
							collection: "professionals"
						}
					};
					if( account && account._id) {
						newAccount._id = account._id;
						newAccount.OTP = account.OTP?account.OTP:false;
					} else {
						newAccount.OTP = false;
					}
					physioDOM.db.collection("account").save(newAccount, function (err, result) {
						if(err) { throw err; }
						if( isNaN(result)) {
							newAccount._id = result._id;
						}
						that.account = newAccount._id;
						// that.active = true;
						that.save()
							.then( function( professional ) {
								logger.info("professional saved",newAccount.OTP );
								resolve( { professional:professional, OTP:newAccount.OTP } );
							})
							.catch( reject );
					});
				})
				.catch( reject );
		});
	};
	
	this.accountUpdatePasswd = function( newPasswd ) {
		logger.trace( "accountUpdatePasswd" );
		var that = this;
		return new promise( function(resolve, reject) {
			that.getAccount()
				.then(function (account) {
					account.password = md5(newPasswd);
					account.firstlogin = false;
					physioDOM.db.collection("account").save(account, function (err, result) {
						if(err) { throw err; }
						resolve( account );
					});
				})
				.catch(reject);
		});
	};
	
	this.createCert = function(req, res) {
		var that = this;
		
		return new promise( function(resolve, reject) {
			logger.trace("createCert" );
			that.getAccount()
				.then( function(account) {
					var email = that.getEmail();
					var cookies = new Cookies(req, res);
					
					var certRequest = {
						certrequest: {
							Application       : physioDOM.config.IDS.appName,
							Requester         : req.headers["ids-user"],
							AuthCookie        : cookies.get("sessionids"),
							OrganizationUnit  : physioDOM.config.IDS.OrganizationUnit,
							Owner             : "03" + email,
							Identifier        : email,
							Privilege         : 255,
							Profile           : 0,
							Duration          : physioDOM.config.IDS.duration?physioDOM.config.IDS.duration:365,
							AuthenticationMask: 8,
							Number            : 3,
							Comment           : "Create certificate for " + email
						}
					};
					
					var wsdl = 'http://api.idshost.priv/pki.wsdl';
					soap.createClient(wsdl, function (err, client) {
						if (err) {
							logger.alert("error ", err);
							throw err;
					 	}

					 	client.CertRequest(certRequest, function (err, result) {
							if (err) {
								throw err;
							} else {
								logger.info("certResponse", result);
								account.OTP = result.certresponse.OTP;
					 			physioDOM.db.collection("account").save(account, function(err, result) {
									if(err) {
										reject(err);
									} else {
										resolve(account);
									}
								});
							}
						});
					});
				})
				.catch( reject );
		});
	};

	this.revokeCert = function(req, res) {
		var that = this;
		logger.trace("revokeCert" );
		
		return new promise( function(resolve, reject) {
			that.getAccount()
				.then( function(account) {
					var cookies = new Cookies(req, res);
					var email = that.getEmail();
					
					var CertRevocate = {
						certRevocateRequest : {
							Application       : physioDOM.config.IDS.appName,
							Requester         : req.headers["ids-user"],
							AuthCookie        : cookies.get("sessionids"),
							OrganizationUnit  : physioDOM.config.IDS.OrganizationUnit,
							Owner             : "03" + email,
							Index             : -1,
							Comment           : "Revoke all certificates for " + email
						}
					};
					
					var wsdl = 'http://api.idshost.priv/pki.wsdl';
					soap.createClient(wsdl, function (err, client) {
						if(err) {
							logger.alert(err);
							throw(err);
						} else {
							client.CertRevocate(CertRevocate, function (err, result) {
								if (err) {
									if(err.root.Envelope.Body.Fault.faultcode === "E_NOTFOUND" ) {
										logger.warning( "certificat not found" );
										account.OTP = false;
										physioDOM.db.collection("account").save(account, function (err, result) {
											if (err) {
												reject(err);
											} else {
												resolve(account);
											}
										});
									} else {
										logger.warning(err);
										throw err;
									}
								} else {
									logger.info("certRevokeResponse", result);
									account.OTP = false;
									physioDOM.db.collection("account").save(account, function (err, result) {
										if (err) {
											reject(err);
										} else {
											resolve(account);
										}
									});
								}
							});
						}
					});
				})
				.catch( function(err) {
					if(err.stack) {
						console.log(err.stack);
					} else {
						console.log(err);
					}
					reject(err);
				});
		});
	};
}

module.exports = Professional;