/**
 * @file beneficiary.js
 * @module Beneficiary
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	beneficiarySchema = require("./../schema/beneficiarySchema");

var logger = new Logger("Beneficiary");

/**
 * Manage a beneficiary record
 * 
 * @constructor
 */
function Beneficiary( ) {

	/**
	 * Get a beneficiary in the database known by its ID
	 * 
	 * on success the promise returns the beneficiary record,
	 * else return an error ( code 404 )
	 * 
	 * @param beneficiaryID
	 * @param professional
	 * @returns {promise}
	 */
	this.getById = function( beneficiaryID, professional ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getById", beneficiaryID);
			var search = { _id: beneficiaryID };
			if( ["administrator","coordinator"].indexOf(professional.role) === -1) {
				search.professionals = { '$elemMatch' : { professionalID: professional._id.toString() }};
			}
			
			physioDOM.db.collection("beneficiaries").findOne(search, function (err, doc) {
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
					if( !that.address ) {
						that.address = [ { use:"home" }];
					}
					if( !that.telecom ) {
						that.telecom = [ { system:"phone" }];
					}
					resolve(that);
				}
			});
		});
	};

	/**
	 * Get a beneficiary known by its ID : `beneficiaryID`
	 * 
	 * This method is used to create or modify a beneficiary
	 * the professional must be an administrator or a coordinator
	 * 
	 * if beneficiaryID is null the promise return an empty structure
	 * 
	 * @param beneficiaryID
	 * @param professional
	 * @returns {promise}
	 */
	this.getAdminById = function( beneficiaryID, professional ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getAdminById", beneficiaryID);
			var result = { telecom: [ { system:"phone" } ], address:[ { use:"home"} ] };
			that.getById(beneficiaryID, professional)
				.then(function (beneficiary) {
					result = beneficiary;
					return beneficiary.getAccount();
				})
				.then( function(account) {
					result.account = account;
					resolve(result);
				})
				.catch( function( err ) {
					logger.warning("error",err);
					resolve(result);
				});
		});
	};

	/**
	 * return account information about the beneficiary
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
	 * save the beneficiary in the database
	 * 
	 * the promise return the beneficiary object completed with the `_id` for a new record
	 * 
	 * @returns {promise}
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("-> save" );
			
			physioDOM.db.collection("beneficiaries").save( that, function(err, result) {
				if(err) { 
					throw err; 
				}
				if( isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};

	/**
	 * Check that there's no beneficiary already exists with the same
	 *  name, birthdate and telecom
	 *  
	 * @todo set a regexp case insensitive for the name
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkUniq( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkUniq");
			// check that the entry have an email
			
			var filter = { name: entry.name, birthdate: entry.birthdate, telecom: entry.telecom };
			if( entry._id ) {
				filter._id = { "$ne": new ObjectID(entry._id) };
			}
			physioDOM.db.collection("beneficiaries").count( filter , function(err,nb) {
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
	 * Check the schema of a beneficiary record
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkSchema( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = beneficiarySchema.validator.validate( entry, { "$ref":"/Beneficiary"} );
			if( check.errors.length ) {
				// console.log(JSON.stringify(check.errors,null,4));
				return reject( { error:"bad format", detail: check.errors } );
			} else {
				return resolve(entry);
			}
		});
	}

	/**
	 * initialize a beneficiary with the object `newEntry`
	 * 
	 * the promise return on success the beneficiary record
	 * 
	 * @param newEntry
	 * @returns {promise}
	 */
	this.setup = function( newEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("setup");
			checkSchema(newEntry)
				.then(checkUniq)
				.then(function (entry) {
					for (var key in newEntry) {
						if (newEntry.hasOwnProperty(key)) {
							that[key] = newEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	/**
	 * Update the beneficiary
	 * 
	 * `updatedEntry` is a full object that replace the old one
	 * 
	 * @param updatedEntry
	 * @returns {promise}
	 */
	this.update = function( updatedEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("update");
			if( that._id.toString() !== updatedEntry._id ) {
				logger.warning("not same beneficiary");
				throw { code:405, message:"not same beneficiary"};
			}
			updatedEntry._id = that._id;
			checkSchema(updatedEntry)
				.then(function (updatedEntry) {
					logger.debug("schema is valid");
					for (var key in updatedEntry) {
						if (key !== "_id" && updatedEntry.hasOwnProperty(key)) {
							that[key] = updatedEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	this.getEvents = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getEvents");
			resolve({});
		});
	};

	this.getHealthServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getHealthServices");
			resolve({});
		});
	};

	this.getSocialServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getSocialServices");
			resolve({});
		});
	};

	this.getDietaryServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getDietaryServices");
			resolve({});
		});
	};

	/**
	 * Get Professionals list attached to the beneficiary
	 * 
	 * @returns {promise}
	 */
	this.getProfessionals = function() {
		var that = this;
		if( that.professionals === undefined ) {
			that.professionals = [];
		}
		return new promise( function(resolve, reject) {
			logger.trace("getProfessionals");
			var count = that.professionals.length;
			if( !count ) {
				resolve( [] );
			}
			physioDOM.Directory()
				.then(function (directory) {
					that.professionals.forEach( function( item, i ) {
						directory.getEntryByID( item.professionalID.toString() )
							.then( function( professional ) {
								that.professionals[i] = professional;
								that.professionals[i].referent = item.referent;
							})
							.then( function() {
								if( --count === 0) {
									resolve( that.professionals );
								}
							})
							.catch( function(err) {
								if( --count === 0) {
									resolve( that.professionals );
								}
							});
					});
				})
				.catch( function(err) {
					logger.error("error ",err);
					reject(err);
				});
		});
	};

	/**
	 * Attach a professional to the beneficiary
	 * 
	 * @param professionalID
	 * @param referent
	 * @returns {promise}
	 */
	this.addProfessional = function( professionalID, referent ) {
		var that = this;
		if( !that.professionals ) {
			that.professionals = [];
		}
		return new promise(function (resolve, reject) {
			logger.trace("addProfessional ", professionalID);
			physioDOM.Directory()
				.then(function (directory) {
					return directory.getEntryByID(professionalID);
				})
				.then( function( professional ) {
					// check if professional is already added
					var indx = -1;
					that.professionals.forEach( function( item, i ) {
						if ( item.professionalID.toString() === professional._id.toString() ) {
							console.log("professional found");
							indx = i;
						}
					});
					console.log("indx", indx);
					if(indx !== -1) {
						that.professionals[indx] = {professionalID: professional._id, referent: referent || false};
					} else {
						that.professionals.push({professionalID: professional._id, referent: referent || false});
					}
					return that.save();
				})
				.then( function() {
					return that.getProfessionals();
				})
				.then( function(professionals) {
					resolve(professionals);
				})
				.catch( function(err) {
					logger.error("error ",err);
					reject(err);
				});
		});
	};

	/**
	 * Attach an array of professionals to the beneficiary
	 *
	 * @param professionals {array} array of objects 
	 *        { professionalID: xxxx, referent: true|false }`
	 * @param referent
	 * @returns {promise}
	 */
	this.addProfessionals = function( professionals ) {
		var that = this;
		if( !that.professionals ) {
			that.professionals = [];
		}
		
		return new promise(function (resolve, reject) {
			logger.trace("addProfessionals ");
			physioDOM.Directory()
				.then(function (directory) {
					function check( professionalObj ) {
						return new promise(function (resolve, reject) {
							directory.getEntryByID(professionalObj.professionalID)
								.then(function( professional) {
									resolve({
										professionalID: professional._id,
										referent: professionalObj.referent && professionalObj.referent===true?true:false
									});
								})
								.catch( function(err) {
									reject(err);
								} );
						});
					}
					
					return RSVP.all(professionals.map(check));
				})
				.then( function( professionals ) {
					that.professionals = professionals;
					return that.save();
				})
				.then( function() {
					return that.getProfessionals();
				})
				.then( function(professionals) {
					resolve(professionals);
				})
				.catch( function(err) {
					logger.error("error ",err);
					reject(err);
				});
		});
	};
	
	/**
	 * remove a professional from a beneficiary
	 * 
	 * @param professionalID
	 * @returns {promise}
	 */
	this.delProfessional = function( professionalID ) {
		var that = this;
		if( !that.professionals ) {
			that.professionals = [];
		}
		return new promise(function (resolve, reject) {
			logger.trace("delProfessional ", professionalID);
			physioDOM.Directory()
				.then(function (directory) {
					return directory.getEntryByID(professionalID);
				})
				.then(function (professional) {
					// check if professional is already added
					var indx = -1;
					
					that.professionals.forEach(function (item, i) {
						if (item.professionalID.toString() === professional._id.toString()) {
							indx = i;
						}
					});
					if (indx !== -1) {
						if (that.professionals.length > 1) {
							that.professionals.splice(indx, 1);
						} else {
							that.professionals = [];
						}
						return that.save();
					} else {
						throw {code: 404, message: "-> professional " + professionalID + " not found"};
					}
				})
				.then(function () {
					return that.getProfessionals();
				})
				.then(function (professionals) {
					resolve(professionals);
				})
				.catch(function (err) {
					logger.error("error ", err);
					reject(err);
				});
		});	
	};

	/**
	 * Not implemented
	 * 
	 * @returns {promise}
	 */
	this.getContacts = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getContact");
		});
	};

	this.getMessages = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getMessages");
		});
	};

	this.getIPMessages = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getIPMessages");
		});
	};
}

module.exports = Beneficiary;