/* jslint node:true */
/* global physioDOM */
"use strict";

var Promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Account = require("./account"),
	directorySchema = require("./../schema/directorySchema");

var logger = new Logger("Professional");

function Professional() {
	
	this.getById = function( professionalID ) {
		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace("getById");
			physioDOM.db.collection("professionals").findOne({_id: professionalID }, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"not found"});
				} else {
					logger.debug("test");
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					resolve(that);
				}
			});
		});
	};
	
	this.save = function() {
		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace("save");
			physioDOM.db.collection("professionals").save( that, function(err, result) {
				if(err) { throw err; }
				if( isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};
	
	function checkUniq( entry ) {
		return new Promise( function(resolve, reject) {
			logger.trace("checkUniq");
			// check that the entry have an email
			var email = false;
			var emails = [];
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
	
	function checkSchema( entry ) {
		return new Promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = directorySchema.validator.validate( entry, { "$ref":"/Professional"} );
			if( check.errors.length ) {
				return reject( {error:"bad format"} );
			} else {
				return resolve(entry);
			}
		})
	}
	
	this.init = function( newEntry ) {
		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace("init");
			
			checkSchema( newEntry )
				.then( checkUniq )
				.then( function(entry) {
					for( var key in newEntry ) {
						if(newEntry.hasOwnProperty(key)) {
							that[key] = newEntry[key];
						}
					}
					return that.save();
				})
				.then( resolve )
				.catch( reject );
		});
	};
	
	this.getBeneficiaries = function(pg, offset) {
		// depending of the role of the professional
		// if admin or coordinators : all beneficiaries
		// if other only list of declared beneficiary
		var that = this;
		return new Promise( function( resolve, reject ) {
			// db.benefici
		});
	};

	/**
	 * update the current object with the given updatedItem
	 * 
	 * the promise return the updated object
	 * 
	 * @param {object} updatedItem
	 * @returns {Promise}
	 */
	this.update = function( updatedItem ) {
		var that = this;
		return new Promise( function( resolve, reject ) {
			logger.trace("update");
			if ( updatedItem._id !== that._id.toString()) {
				return reject({ error : "update bad id"});
			}
			updatedItem._id = new ObjectID(updatedItem._id);
			checkSchema( updatedItem )
				.then( checkUniq )
				.then( function(entry) {
					for( var key in entry ) {
						if(entry.hasOwnProperty(key) && key != "_id") {
							that[key] = entry[key];
						}
					}
					return that.save();
				})
				.then( resolve )
				.catch( reject );
		});
	}
}

module.exports = Professional;