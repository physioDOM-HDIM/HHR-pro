/**
 * @file service.js
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

var Promise = require("rsvp").Promise,
	RSVP = require("rsvp"),
	serviceSchema = require("./../schema/serviceSchema"),
	Queue = require("./queue.js"),
	moment = require("moment"),
	Logger = require("logger");

var logger = new Logger("Service");

/**
 * Check that the entry is a valid service
 *
 * @param entry
 * @returns {Promise}
 */
function checkSchema( entry ) {
	return new Promise( function(resolve, reject) {
		logger.trace("checkSchema");

		var check = serviceSchema.validator.validate( entry, { "$ref":"/"+entry.frequency+"Service"} );
		if( check.errors.length ) {
			return reject( {error:"bad format", detail: check.errors} );
		} else {
			return resolve(entry);
		}
	});
}

function Service( ) {
	logger.trace("service constructor");
}

Service.prototype.setup = function( serviceObj ) {
	var that = this;
	return new Promise( function( resolve, reject) {
		logger.trace("setup", that._id, serviceObj._id);
		checkSchema( serviceObj )
			.then( function(entry) {
				if (entry._id && ( 
						that.frequency !== entry.frequency || 
						that.when !== entry.when || 
						that.repeat !== entry.repeat ||
						that.time !== entry.time ||
						that.duration !== entry.duration
					)) {
					return that.deactivate(entry.source)
						.then( function() {
							logger.debug( "create a new service ");
							delete entry._id;
							delete that._id;
							if( that.startDate <= moment().format("YYYY-MM-DD") ) {
								entry.startDate = moment().add(1,"d").format("YYYY-MM-DD");
							}
							var service = new Service();
							return service.setup( entry );
						});
				} else {
					for (var key in entry) {
						if (entry.hasOwnProperty(key)) {
							that[key] = entry[key];
						}
					}
					return that.save();
				}
			})
			.then( function( service ) {
				resolve( service );
			})
			.catch( reject );
	});
};

Service.prototype.getByID = function( serviceID ) {
	logger.trace("getByID", serviceID);
	var that = this;
	return new Promise( function( resolve, reject) {
		var search = {
			_id: serviceID
		};

		physioDOM.db.collection("services").findOne( search, function( err, service ) {
			if( err ) {
				reject(err);
			} else {
				if( service ) {
					for( var key in service ) {
						if (service.hasOwnProperty(key)) {
							that[key] = service[key];
						}
					}
					resolve( that );
				} else {
					reject( { code:404, message: "service not found : "+serviceID });
				}
			}
		});
	});
};

Service.prototype.getDetail = function() {
	var that = this;
	
	return new Promise( function(resolve, reject) {
		logger.trace("getServiceDetail", that._id );

		physioDOM.Directory()
			.then(function (directory) {
				
				function getProfessional( profID ) {
					return new Promise( function( resolve ) {
						if( !profID  ) {
							resolve({family:"",given:"" });
						} else {
							directory.getEntryByID(profID)
								.then( function( prof ) {
									resolve( prof.name );
								})
								.catch( function() {
									logger.warning("getServiceDetail : could not find professional", profID );
									resolve( );
								});
						}
					});
				}
				
				var promises = { 
					sourceName: getProfessional( that.source ),
					providerName: getProfessional( that.provider ),
					deactivatedName: getProfessional( that.deactivated && that.deactivated.source?that.deactivated.source:null )
				};

				return RSVP.hash(promises);
			})
			.then(function (professionals) {
				that.sourceName = professionals.sourceName;
				that.providerName = professionals.providerName;
				if( that.deactivated ) {
					that.deactivated.sourceName = professionals.deactivatedName;
				}
				resolve( that );
			})
			.catch( function(err) {
				logger.alert(err);
				if(err.stack) { console.log(err.stack); }
				reject(err);
			});
	});
};

Service.prototype.save = function( ) {
	var that = this;

	return new Promise( function(resolve) {
		logger.trace("save");
		that.create = that._id?false:true;
		physioDOM.db.collection("services").save( that, function(err, result) {
			if(err) { throw err; }
			if( isNaN(result)) {
				that._id = result._id;
			}
			that.pushToQueue();
			resolve( that );
		});
	});
};

Service.prototype.pushToQueue = function() {
	logger.trace("pushToQueue");
	var queue = new Queue(this.subject);
	
	var leaf = "hhr[" + this.subject + "]";
	switch( this.category ) {
		case "HEALTH":
			leaf+=".healthcare.services["+this._id+"]";
			break;
		case "SOCIAL":
			leaf+=".social.services["+this._id+"]";
			break;
	}
	
	var msg = [];
	var that = this;
	
	function _pushService() {
		return new Promise(function (resolve, reject) {
			moment.locale(physioDOM.lang === "en" ? "en-gb" : physioDOM.lang);
			
			if( that.active === false ) {
				msg.push( {branch: leaf} );
				queue.delMsg(msg)
					.then( function() {
						resolve(msg);
					})
					.catch( reject );
			} else {
				msg.push({
					name : leaf + ".label",
					value: that.refLabel[physioDOM.lang] || that.ref,
					type : "string"
				});
				msg.push({
					name : leaf + ".proLastName",
					value: that.providerName.family,
					type : "string"
				});
				msg.push({
					name : leaf + ".proFirstName",
					value: that.providerName.given,
					type : "string"
				});
				msg.push({
					name : leaf + ".frequency",
					value: that.frequency,
					type : "string"
				});
				msg.push({
					name : leaf + ".description",
					value: that.detail,
					type : "string"
				});
				msg.push({
					name : leaf + ".startDateTime",
					value: moment(that.startDate+"T"+that.time).unix(),
					type : "string"
				});
				msg.push({
					name : leaf + ".endDateTime",
					value: moment(that.startDate+"T"+that.time).add(that.duration,"m").unix(),
					type : "string"
				});
				if( that.create ) {
					msg.push({
						name : leaf + ".new",
						value: 1,
						type : "string"
					});
				}

				queue.postMsg(msg)
					.then(function () {
						resolve(msg);
					})
					.catch( reject );
			}
		});
	}
	
	this.getDetail()
		.then( function( service ) {
			_pushService( service );
		})
		.catch( function(err) {
			if( err.stack ) {
				console.log(err.stack);
			}
			logger.alert( err );
		});
};

Service.prototype.deactivate = function( source ) {
	logger.trace("deactivate", this._id, source );
	
	this.active = false;
	this.deactivated = {
		source: source,
		date: moment().toISOString()
	};
	return this.save();
};

module.exports = Service;