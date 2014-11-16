/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	beneficiarySchema = require("./../schema/beneficiarySchema");

var logger = new Logger("Beneficiary");


function Beneficiary( ) {

	this.getById = function( beneficiaryID, professional ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getById");
			var search = {_id: beneficiaryID };
			if( ["adminstrator","coordinator"].indexOf(professional.role) === -1) {
				search["$elemMatch"] = { professionalID: professional._id };
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

	function checkSchema( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = beneficiarySchema.validator.validate( entry, { "$ref":"/Beneficiary"} );
			if( check.errors.length ) {
				console.log(JSON.stringify(check.errors,null,4));
				return reject( { error:"bad format" } );
			} else {
				return resolve(entry);
			}
		});
	}
	
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
		});
	};

	this.getHealthServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getHealthServices");
		});
	};

	this.getSocialServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getSocialServices");
		});
	};

	this.getDietaryServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getDietaryServices");
		});
	};

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