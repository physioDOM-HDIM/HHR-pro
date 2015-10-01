/**
 * @file service.js
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

var Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	dbPromise = require("./database.js"),
	serviceSchema = require("./../schema/serviceSchema"),
	moment = require("moment"),
	Logger = require("logger");

var logger = new Logger("Services");

function Services( beneficiary ) {
	this.subject = beneficiary._id;
}

function getServiceDetail( service ) {
	return new Promise( function(resolve, reject) {
		logger.trace("getServiceDetail", service._id );
		
		physioDOM.Directory()
			.then(function (Directory) {
				var promises = [ service.source ].map(function (professionalID) {
					return Directory.getEntryByID(professionalID);
				});

				return Promise.all(promises);
			})
			.then(function (professionals) {
				service.sourceName = professionals[0].name;
				resolve( service );
			})
			.catch( function(err) {
				logger.alert(err);
				if(err.stack) { console.log(err.stack); }
				reject(err);
			});
	});
}

/**
 * Get the list of services for a beneficiary
 * 
 * @param category : HEALTH or SOCIAL
 * @param active   : if true only active services else all services 
 * @returns {*}
 */
Services.prototype.getServices = function( category, active ) {
	logger.trace("getServices", category + " " + (active===true?"active":"all"));
	logger.trace("getServices active ",active );
	var that = this;
	
	return new Promise( function(resolve, reject) {
		if( category && ["HEALTH","SOCIAL","ASSIST"].indexOf(category.toUpperCase()) === -1 ) {
			throw { code: 405, message: "bad category name"};
		}
		var search = {
			subject : that.subject
		};
	
		if( category ) {
			search.category = category.toUpperCase();
		}
		if( active ) {
			search.active = true;
		}
		
		var cursor = physioDOM.db.collection("services").find(search).sort({ active: 1 });
		dbPromise.getList(cursor, 1, 1000)
			.then( function( services ) {
				var promises = services.items.map( function(service) {
					return( getServiceDetail(service) );
				});

				return Promise.all(promises);
			})
			.then( resolve )
			.catch( function(err) {
				logger.alert(err);
				if(err.stack) { console.log(err.stack); }
				reject(err);
			});
	});
};

/**
 * Get services items to display them on the agenda
 * 
 * a displayed item looks like
 * 
 *     {
 *         "label": "Drug administration",       <- label to display
 *         "className": "event6",                <- css style to apply
 *         "start": "2015-09-30T17:00:00+00:00", <- service start date time
 *         "end": "2014-09-30T17:30:00+00:00",   <- service end date time
 *         "serviceID": 4,                       <- ID of the service
 *         "allDay": true                        <- if true endDate is null
 *     }
 * 
 * @param startDate  first date to be displayed ( format YYYY-MM-DD )
 * @param nbDays     number of days since startDate
 * @param lang       language of the current user
 */
Services.prototype.getServicesItems = function( startDate, nbDays, lang ) {
	logger.trace("getServicesItems");
	var that = this;
	
	var styles = {
		"HEALTH": "event6",
		"SOCIAL": "event4",
		"ASSIST": "event2",
		"QUEST" : "event3"
	};
	return new Promise( function(resolve, reject) {
		var servicesItems = [];
		var endDate = moment(startDate).add(nbDays,'d').format("YYYY-MM-DD");
		var item;
		var search = {
			subject: that.subject,
			startDate: { '$lte' : endDate },
			endDate: { '$gte' : startDate }
		};
		physioDOM.db.collection("services").find(search).toArray( function(err, res ) {
			res.forEach( function(service) {
				switch( service.frequency ) {
					case 'daily':
						// calculate the first available date
						var servDate = moment(service.startDate);
						while( servDate.format("YYYY-MM-DD") < startDate ) {
							servDate.add( service.repeat,'d');
						}
						do {
							item = { 
								label : service.ref,
								className : styles[service.category],
								start: moment(servDate).format("YYYY-MM-DD")+"T"
							};
							servicesItems.push(item);
							servDate.add( service.repeat,'d');
						} while( servDate.format("YYYY-MM-DD") <= endDate );
						break;
					case 'weekly':
						break;
					case 'monthly':
						break;
				}
			});
			resolve( servicesItems );
		});
		
	});
};

Services.prototype.getServiceByID = function( serviceID ) {
	logger.trace("getServiceByID", serviceID );
	var that = this;
	
	return new Promise( function(resolve, reject) {
		if( !/^[0-9a-fA-F]{24}$/.test(serviceID) ) {
			return reject( { "code":405, "message":"bad serviceID"} );
		}
		
		var search = {
			subject : that.subject,
			_id: new ObjectID(serviceID) || null
		};
		
		physioDOM.db.collection("services").findOne(search, function( err, service ) {
			if( service ) {
				getServiceDetail( service )
					.then( resolve );
			} else {
				reject( { "code":404, "message":"no service found with this ID for the current beneficiary"} );
			}
		});
	});
};

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

/**
 * create a new Service for the current beneficiary
 * 
 * resolve with an object :
 * 
 *       {
 *            service : service,
 *            create : true | false
 *       }
 * 
 * The create property is needed to create the entry in the journal ( cf Iservices.putService )
 * 
 * @param serviceObj object from a form ( form2js )
 * @param source     id of the user that create or modify the service.
 * @returns {*}
 */
Services.prototype.putService = function( serviceObj, source ) {
	var that = this;
	return new Promise( function(resolve, reject) {
		logger.trace("putService");
		
		if( serviceObj.subject !== that.subject+"" ) {
			throw { code: 403, message : "can't edit another beneficiary"};
		}
		serviceObj.subject = that.subject;
		serviceObj.provider = serviceObj.provider?new ObjectID(serviceObj.provider):null;
		serviceObj.source = source;
		if( serviceObj._id ) { serviceObj._id = new ObjectID(serviceObj._id) }
		
		checkSchema( serviceObj )
			.then( function(entry) {
				for (var key in entry) {
					if (entry.hasOwnProperty(key)) {
						that[key] = entry[key];
					}
				}
				return that.save();
			}) 
			.then( resolve )
			.catch(reject);
	});
};

Services.prototype.save = function( ) {
	var that = this;
	
	return new Promise( function(resolve) {
		logger.trace("save");
		var create = false;
		physioDOM.db.collection("services").save( that, function(err, result) {
			if(err) { throw err; }
			if( isNaN(result)) {
				that._id = result._id;
				create = true;
			}
			resolve({ service:that, create: create } );
		});
	});
};

Services.prototype.remove = function( serviceID ) {
	var that = this;

	return new Promise( function(resolve) {
		logger.trace("remove", serviceID);
		var search = {
			_id: new ObjectID(serviceID),
			subject: that.subject
		};
		physioDOM.db.collection("services").remove( search, function( err, nb) {
			resolve( nb?true:false );
		});
	});
};

module.exports = Services;