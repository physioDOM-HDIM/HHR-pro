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
	md5 = require('MD5');

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
				logger.info("count",nb);
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
	this.init = function( newEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("init");
			
			checkSchema( newEntry )
				.then( checkUniq )
				.then( function(entry) {
					for( var key in newEntry ) {
						if(newEntry.hasOwnProperty(key)) {
							switch(key) {
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
					return that.save();
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
	this.update = function( updatedItem ) {
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
					var key;
					for( key in entry ) {
						if(entry.hasOwnProperty(key) && ["_id","account"].indexOf(key) === -1) {
							if( key==="active" && entry.active === true && that.active !== entry.active && !that.account ) {
								that.active = false;
							} else {
								that[key] = entry[key];
								switch(key) {
									case "name":
										that.name.family = capitalize(that.name.family);
										if( that.name.given ) {
											that.name.given = capitalize(that.name.given);
										}
										break;
									default:
								}
							}
						}
					}

					for( key in that ) {
						if(that.hasOwnProperty(key) && typeof that[key] !== "function" && !entry.hasOwnProperty(key)) {
							delete that[key];
						}
					}
					return that.save();
				})
				.then( function(professional) {
					return professional.getAccount();
				})
				.then( function(account) {
					if( account.hasOwnProperty("active") && account.active !== that.active ) {
						logger.debug("update account active flag");
						account.active = that.active;
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

	/**
	 * @method accountUpdate
	 * 
	 * update account information of the professional, resolve with the updated object
	 * 
	 * @param accountData
	 * @returns {promise}
	 */
	this.accountUpdate = function( accountData ) {
		var that = this;
		return new promise( function(resolve, reject) {
			that.getAccount()
				.then( function(account) {
					logger.trace("account");
					if (!accountData.login || !accountData.password) {
						return reject({error: "account data incomplete"});
					}
					var newAccount = {
						login   : accountData.login,
						password: md5(accountData.password),
						active  : that.active,
						role    : that.role,
						person  : {
							id        : that._id,
							collection: "professionals"
						}
					};
					if( account && account._id) {
						newAccount._id = account._id;
					} 
					physioDOM.db.collection("account").save(newAccount, function (err, result) {
						if(err) { throw err; }
						if( isNaN(result)) {
							newAccount._id = result._id;
						}
						that.account = newAccount._id;
						that.active = true;
						resolve(that.save());
					});
				})
				.catch( reject );
		});
	};
}

module.exports = Professional;