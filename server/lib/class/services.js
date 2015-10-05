/**
 * @file services.js
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

var Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	dbPromise = require("./database.js"),
	serviceSchema = require("./../schema/serviceSchema"),
	Service = require("./service.js"),
	moment = require("moment"),
	Logger = require("logger");

var logger = new Logger("Services");

function Services( beneficiary ) {
	this.subject = beneficiary._id;
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
	
	var that = this;
	
	return new Promise( function(resolve, reject) {
		if( category && category !== "all" && ["HEALTH","SOCIAL","ASSIST"].indexOf(category.toUpperCase()) === -1 ) {
			throw { code: 405, message: "bad category name"};
		}
		var search = {
			subject : that.subject
		};
	
		if( category && category !== "all" ) {
			search.category = category.toUpperCase();
		}
		if( active ) {
			search.active = true;
		}
		
		var cursor = physioDOM.db.collection("services").find(search).sort({ active: -1, category:1 });
		dbPromise.getList(cursor, 1, 1000)
			.then( function( services ) {
				var promises = services.items.map( function(serviceObj) {
					return new Promise( function(resolve, reject) {
						var service = new Service();
						service.getByID(serviceObj._id)
							.then( function(service) {
								return service.getDetail();
							})
							.then( resolve )
							.catch( reject );
					});
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
	logger.trace("getServicesItems", startDate, nbDays, lang);
	var that = this;
	
	var styles = {
		"HEALTH": "event6",
		"SOCIAL": "event4",
		"ASSIST": "event2",
		"QUEST" : "event3"
	};
	var endDate = moment(startDate).add(nbDays, 'd').format("YYYY-MM-DD");
	
	moment.locale(physioDOM.lang === "en" ? "en-gb" : physioDOM.lang);
	
	function _getItem( service ) {
		return new Promise( function(resolve, reject) {
			var item;
			var servDate, closeDate, start, end;
			var serviceItems = [];
			
			switch( service.frequency ) {
				case 'punctual':
					servDate = moment(service.startDate);
					if( servDate.format("YYYY-MM-DD") >= moment(startDate).format("YYYY-MM-DD") && servDate.format("YYYY-MM-DD") <= endDate ) {
						start = moment(servDate).format("YYYY-MM-DD") + "T" + service.time;
						start = moment(start).format("YYYY-MM-DDTHH:mm");
						end = moment(start).add(service.duration, "m").format("YYYY-MM-DDTHH:mm");
						item = {
							serviceID: service._id,
							label    : service.ref,
							className: styles[service.category],
							start    : start,
							end      : end,
							provider : service.providerName
						};
						serviceItems.push(item);
					}
					break;
				case 'daily':
					// calculate the first available date
					servDate = moment(service.startDate);
					closeDate = service.endDate < endDate?service.endDate:endDate;
					while( servDate.format("YYYY-MM-DD") < startDate ) {
						servDate.add( service.repeat,'d');
					}
					do {
						start = moment(servDate).format("YYYY-MM-DD")+"T"+service.time;
						start = moment(start).format("YYYY-MM-DDTHH:mm");
						end = moment(start).add( service.duration, "m").format("YYYY-MM-DDTHH:mm");
						item = {
							serviceID : service._id,
							label : service.ref,
							className : styles[service.category],
							start: start,
							end: end,
							provider: service.providerName
						};
						serviceItems.push(item);
						servDate.add( service.repeat,'d');
					} while( servDate.format("YYYY-MM-DD") <= closeDate );
					break;
				case 'weekly':
					servDate = moment(service.startDate);
					closeDate = service.endDate < moment(endDate).format("YYYY-MM-DD")?service.endDate:moment(endDate).format("YYYY-MM-DD");
					startDate = moment(startDate).subtract(service.repeat, 'w');
					while( servDate.format("YYYY-MM-DD") < startDate ) {
						servDate.add( service.repeat,'w');
					}
					do {
						start = moment(servDate).format("YYYY-MM-DD")+"T"+service.time;
						start = moment(start).format("YYYY-MM-DDTHH:mm");
						end = moment(start).add( service.duration, "m").format("YYYY-MM-DDTHH:mm");
						service.when.forEach( function(when) {
							start = moment(start).day(when).format("YYYY-MM-DDTHH:mm");
							end = moment(end).day(when).format("YYYY-MM-DDTHH:mm");
							item = {
								serviceID : service._id,
								label : service.ref,
								start: start,
								end: end,
								className: "event1",
								provider: service.providerName
							};
							serviceItems.push(item);
						});
						servDate.add( service.repeat,'w');
					} while( servDate.format("YYYY-MM-DD") <= closeDate );
					break;
				case 'monthly':
					servDate = moment(service.startDate);
					closeDate = service.endDate < moment(endDate).format("YYYY-MM-DD")?service.endDate:moment(endDate).format("YYYY-MM-DD");
					startDate = moment(startDate).subtract(service.repeat, 'M');
					while( servDate.format("YYYY-MM-DD") < startDate ) {
						servDate.add( service.repeat,'M');
					}

					var whenDays = [];
					var month = moment(servDate).startOf("month");
					do {
						for( var i=0;i<service.when.length;i++) {
							var when = service.when[i];
							var fd = moment(month).startOf("month");
							// premier lundi du mois 
							fd.add( (fd.day() === 1 ? 0:8-fd.day()?fd.day():7),"d");
							fd.day(when % 10);
							if (fd.month() !== month.month()) {
								fd = fd.add(7, "d");
							}
							fd.add(parseInt(when / 10, 10) - 1, "w");
							if (fd.month() === month.month() && fd.format("YYYY-MM-DD") <= service.endDate ) {
								whenDays.push(fd.format("YYYY-MM-DD"));
							}
						}
						month = month.add(1,"M");
					} while( month.format("YYYY-MM-DD") < closeDate );

					whenDays.forEach( function( day ) {
						start = moment(day).format("YYYY-MM-DD")+"T"+service.time;
						start = moment(start).format("YYYY-MM-DDTHH:mm");
						end = moment(start).add( service.duration, "m").format("YYYY-MM-DDTHH:mm");
						item = {
							serviceID : service._id,
							label    : service.ref,
							className: "event3",
							start    : start,
							end      : end,
							provider: service.providerName
						};
						serviceItems.push(item);
					});
					break;
			}
			resolve( serviceItems );
		});
	}
	return new Promise( function(resolve, reject) {
		var servicesItems = [];

		var search = {
			subject  : that.subject,
			startDate: {'$lte': endDate},
			endDate  : {'$gte': startDate},
			active   : true
		};

		physioDOM.db.collection("services").find(search).toArray(function (err, res) {
			var promises = res.map(function (_service) {
				console.log( _service.ref, _service.frequency );
				return new Promise(function (resolve, reject) {
					var service = new Service();
					service.getByID(_service._id)
						.then(function (service) {
							return service.getDetail();
						})
						.then(function (service) {
							return _getItem(service);
						})
						.then(function(items) {
							resolve(items);
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
			});

			Promise.all(promises)
				.then(function (_servicesItems) {
					_servicesItems.forEach(function (items) {
						servicesItems = servicesItems.concat(items);
					});
					resolve(servicesItems);
				});

		});
	});
};

Services.prototype.pushToQueue = function( ) {
	
};

/**
 * get a service defined by it's ID in the database
 * the ID is pass as a string
 * 
 * @param serviceID {string} the identifier of the service
 */
Services.prototype.getByID = function( serviceID ) {
	return new Promise( function( resolve, reject) {
		if( !/^[0-9a-fA-F]{24}$/.test(serviceID) ) {
			return reject( { "code":405, "message":"bad serviceID"} );
		}
		
		var service = new Service();
		service.getByID( new ObjectID(serviceID) )
			.then( function( service ) {
				return service.getDetail();
			})
			.then( resolve )
			.catch( reject );
	});
};

Services.prototype.getServiceByID = function( serviceID ) {
	logger.trace("getServiceByID", serviceID );
	var that = this;
	
	return new Promise( function(resolve, reject) {
		that.getByID( serviceID )
			.then( resolve )
			.catch( reject );
	});
};

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
		
		if( serviceObj.subject && serviceObj.subject !== that.subject+"" ) {
			throw { code: 403, message : "can't edit another beneficiary"};
		}
		serviceObj.subject = that.subject;
		serviceObj.provider = serviceObj.provider?new ObjectID(serviceObj.provider):null;
		serviceObj.source = source;
		if( serviceObj._id ) { serviceObj._id = new ObjectID(serviceObj._id) }
		
		var service = new Service();
		if ( serviceObj._id) {
			service.getByID( serviceObj._id )
				.then( function( service ) {
					return service.setup( serviceObj );
				})
				.then( resolve )
				.catch( reject );
		} else {
			service.setup(serviceObj)
				.then(resolve)
				.catch(reject);
		}
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

Services.prototype.deactivate = function( serviceID, source ) {
	return new Promise( function(resolve, reject) {
		logger.trace( "deactivate", serviceID, source );
		var service = new Service();
		service.getByID( serviceID )
			.then( function(service) {
				return service.deactivate( new ObjectID( source ) );
			})
			.then( function( service ) {
				resolve(service.getDetail());
			})
			.catch( reject );
	});
};

module.exports = Services;