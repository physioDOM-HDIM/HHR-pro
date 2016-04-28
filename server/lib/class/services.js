/**
 * @file services.js
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

var Promise = require("rsvp").Promise,
	ObjectID = require("mongodb").ObjectID,
	Hash = require('object-hash'),
	dbPromise = require("./database.js"),
	Service = require("./service.js"),
	Queue = require("./queue.js"),
	moment = require("moment-timezone"),
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

Services.prototype.pushServicesToQueue = function() {
	var queue = new Queue(this.subject);
	var that = this;
	var msgs = [];

	function _markDelete() {
		return new Promise( function(resolve, reject) {
			var search = {subject: that.subject};
			physioDOM.db.collection("servicesQueue").update(search, {$set: {del: true, new: false}}, {multi: true}, function (err, nb) {
				if (err) {
					logger.alert(err);
					reject(err);
				} else {
					resolve(nb);
				}
			});
		});
	}

	function register(item) {
		return new Promise(function (resolve ) {
			var search = {
				subject: that.subject,
				hash   : item.hash
			};
			physioDOM.db.collection("servicesQueue").findOne(search, function (err, doc) {
				if (doc) {
					if( doc.endDate >= moment().format("YYYY-MM-DD")) {
						doc.del = false;
						physioDOM.db.collection("servicesQueue").save(doc, function (err, res) {
							resolve();
						});
					} else {
						resolve();
					}
				} else {
					item.new = true;
					if( item.endDate >= moment().format("YYYY-MM-DD")) {
						physioDOM.db.collection("servicesQueue").insert(item, function () {
							resolve();
						});
					} else {
						resolve(); 
					}
				}
			});
		});
	}

	return new Promise( function( resolve ) {
		logger.trace("pushServicesToQueue");
		
		_markDelete()
			.then(function () {
				return that.getServices("all", true);
			})
			.then(function (services) {
				services.forEach(function (service) {
					var item = {
						_id : service._id.toString(),
						subject : service.subject.toString(),
						source : service.source.toString(),
						provider : service.provider?service.provider.toString():""
					};
					service.hash = Hash.sha1(item);
				});
				var promises = services.map(function (service) {
					return register(service);
				});
				return Promise.all(promises);
			})
			.then(function () {
				return new Promise(function (resolve) {
					// create del message for the queue
					var search = {
						subject: that.subject,
						del    : true
					};
					physioDOM.db.collection("servicesQueue").find(search).toArray(function (err, res) {
						res.forEach(function (item) {
							var msg = [];
							var category = item.category === "HEALTH" ? "healthcare" : "social";
							var leaf = "hhr[" + that.subject + "]." + category + "[" + item._id + "]";
							msg.push( {branch: leaf} );
							queue.delMsg(msg);
							msgs.push(msg);
							physioDOM.db.collection("servicesQueue").remove(item, function () {});
						});
						resolve(msgs);
					});
				});
			})
			.then(function () {
				return new Promise(function (resolve) {
					// create add message for the queue
					var search = {
						subject: that.subject,
						del    : false
					};

					moment.locale(physioDOM.lang === "en" ? "en-gb" : physioDOM.lang);

					physioDOM.db.collection("servicesQueue").find(search).toArray(function (err, res) {
						res.forEach(function (item) {
							// create add message for the queue
							var msg = [];
							var category = item.category === "HEALTH" ? "healthcare" : "social";
							var leaf = "hhr[" + that.subject + "]." + category + ".services[" + item._id + "].";
							if( item.new ) {
								msg.push({
									name : leaf + "new",
									value: item.new ? 1 : 0,
									type : "integer"
								});
							}
							msg.push({
								name : leaf + "label",
								value: item.label,
								type : "string"
							});
							msg.push({
								name : leaf + "proLastName",
								value: item.providerName.family,
								type : "string"
							});
							msg.push({
								name : leaf + "proFirstName",
								value: item.providerName.given,
								type : "string"
							});
							msg.push({
								name : leaf + "frequency",
								value: item.frequency,
								type : "string"
							});
							msg.push({
								name : leaf + "description",
								value: item.detail,
								type : "string"
							});
							msg.push({
								name : leaf + "startDatetime",
								value: moment.tz(item.startDate + "T" + item.time,physioDOM.config.timezone).unix(),
								type : "integer"
							});
							msg.push({
								name : leaf + "endDatetime",
								value: moment.tz(item.endDate + "T" + item.time,physioDOM.config.timezone).add(item.duration, "m").unix(),
								type : "integer"
							});

							queue.postMsg(msg);
							msgs.push(msg);
						});
						resolve(msgs);
					});
				});
			})
			.then( resolve )
			.catch(function (err) {
				if (err.stack) {
					console.log(err.stack);
				}
				resolve([]);
			});
	});
};

function _getItem( service, startDate, endDate ) {
	var styles = {
		"HEALTH": "event6",
		"SOCIAL": "event4",
		"ASSIST": "event2",
		"QUEST" : "event3"
	};

	moment.locale(physioDOM.lang === "en" ? "en-gb" : physioDOM.lang);
	
	return new Promise( function(resolve) {
		var item;
		var servDate, closeDate, start, end, startTmp, _endDate;
		var serviceItems = [];

		switch( service.frequency ) {
			case 'punctual':
				servDate = moment(service.startDate);
				_endDate = service.endDate;
				if( service.deactivated ) {
					_endDate = moment(service.deactivated.date).format("YYYY-MM-DD");
				}
				closeDate = _endDate < endDate?_endDate:endDate;
				console.log( "closeDate : ", closeDate, endDate );
				if( servDate.format("YYYY-MM-DD") >= moment(startDate).format("YYYY-MM-DD") && 
					servDate.format("YYYY-MM-DD") <= closeDate ) {
					start = moment(servDate).format("YYYY-MM-DD") + "T" + service.time;
					start = moment(start).format("YYYY-MM-DDTHH:mm");
					end = moment(start).add(service.duration, "m").format("YYYY-MM-DDTHH:mm");
					item = {
						serviceID: service._id,
						label    : service.ref,
						className: styles[service.category],
						start    : start,
						end      : end,
						provider : service.providerName,
						category: service.category,
						title: service.label,
						frequency : service.frequency
					};
					serviceItems.push(item);
				}
				break;
			case 'daily':
				// calculate the first available date
				servDate = moment(service.startDate);
				_endDate = service.endDate;
				if( service.deactivated ) {
					_endDate = moment(service.deactivated.date).format("YYYY-MM-DD");
				}
				closeDate = _endDate < endDate?_endDate:endDate;
				while( servDate.format("YYYY-MM-DD") < startDate ) {
					servDate.add( service.repeat,'d');
				}
				while( servDate.format("YYYY-MM-DD") <= closeDate ) {
					start = moment(servDate).format("YYYY-MM-DD")+"T"+service.time;
					start = moment(start).format("YYYY-MM-DDTHH:mm");
					end = moment(start).add( service.duration, "m").format("YYYY-MM-DDTHH:mm");
					item = {
						serviceID : service._id,
						label : service.ref,
						className : styles[service.category],
						start: start,
						end: end,
						provider: service.providerName,
						category: service.category,
						title: service.label,
						frequency : service.frequency,
						detail: service.detail
					};
					serviceItems.push(item);
					servDate.add( service.repeat,'d');
				}
				break;
			case 'weekly':
				servDate = moment(service.startDate);
				_endDate = service.endDate;
				if( service.deactivated ) {
					_endDate = moment(service.deactivated.date).format("YYYY-MM-DD");
				}
				closeDate = _endDate < endDate?_endDate:endDate;
				
				startTmp = moment(startDate).subtract(service.repeat, 'w').format("YYYY-MM-DD");
				while( servDate.format("YYYY-MM-DD") < startTmp ) {
					servDate.add( service.repeat,'w');
				}
				
				var pushToServiceItems = function(when, start, end) {
					var item;
					
					start = moment(start).day(when).format("YYYY-MM-DDTHH:mm");
					end = moment(end).day(when).format("YYYY-MM-DDTHH:mm");
					if( moment(start).format("YYYY-MM-DD") >= startDate && 
						moment(start).format("YYYY-MM-DD") <= closeDate ) {
						item = {
							serviceID: service._id,
							label    : service.ref,
							start    : start,
							end      : end,
							className: styles[service.category],
							provider : service.providerName,
							category : service.category,
							title    : service.label,
							frequency: service.frequency,
							detail   : service.detail
						};
						serviceItems.push(item);
					}
				};
				
				do {
					start = moment(servDate).format("YYYY-MM-DD")+"T"+service.time;
					start = moment(start).format("YYYY-MM-DDTHH:mm");
					end = moment(start).add( service.duration, "m").format("YYYY-MM-DDTHH:mm");
					service.when.forEach( function(when) {
						pushToServiceItems( when, start, end );
					});
					servDate.add( service.repeat,'w');
				} while( servDate.format("YYYY-MM-DD") <= closeDate );
				break;
			case 'monthly':
				servDate = moment(service.startDate);
				_endDate = service.endDate;
				if( service.deactivated ) {
					_endDate = moment(service.deactivated.date).format("YYYY-MM-DD");
				}
				closeDate = _endDate < endDate?_endDate:endDate;
				
				startTmp = moment(startDate).subtract(service.repeat, 'M').format("YYYY-MM-DD");
				while( servDate.format("YYYY-MM-DD") < startTmp ) {
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
						if (fd.month() === month.month() && fd.format("YYYY-MM-DD") <= _endDate ) {
							whenDays.push(fd.format("YYYY-MM-DD"));
						}
					}
					month = month.add(1,"M");
				} while( month.format("YYYY-MM-DD") < closeDate );

				whenDays.forEach( function( day ) {
					start = moment(day).format("YYYY-MM-DD")+"T"+service.time;
					start = moment(start).format("YYYY-MM-DDTHH:mm");
					end = moment(start).add( service.duration, "m").format("YYYY-MM-DDTHH:mm");
					if( moment(start).format("YYYY-MM-DD") >= startDate &&
						moment(start).format("YYYY-MM-DD") >= service.startDate &&
						moment(start).format("YYYY-MM-DD") <= closeDate ) {
						item = {
							serviceID: service._id,
							label    : service.ref,
							className: styles[service.category],
							start    : start,
							end      : end,
							provider : service.providerName,
							category : service.category,
							title    : service.label,
							frequency: service.frequency,
							detail   : service.detail
						};
						serviceItems.push(item);
					}
				});
				break;
		}
		resolve( serviceItems );
	});
}

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
	var endDate = moment(startDate).add(nbDays, 'd').format("YYYY-MM-DD");
	
	return new Promise( function(resolve) {
		var servicesItems = [];

		var search = {
			subject  : that.subject,
			startDate: {'$lte': endDate},
			endDate  : {'$gte': startDate}
		};

		physioDOM.db.collection("services").find(search).toArray(function (err, res) {
			var promises = res.map(function (_service) {
				return new Promise(function (resolve, reject) {
					var service = new Service();
					service.getByID(_service._id)
						.then(function (service) {
							return service.getDetail();
						})
						.then(function (service) {
							return _getItem(service, startDate, endDate );
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

/**
 * Clear the servicesPlan collection for the selected beneficiary
 * @returns {*}
 */
Services.prototype.clearServicesQueueItems = function() {
	logger.trace("clearServicesQueueItems");
	
	var search = { subject  : this.subject };
	
	return new Promise( function(resolve, reject) {
		physioDOM.db.collection("servicesPlan").remove( search, function(err, res) {
			if(err) {
				console.error(err);
				reject(err);
			} else {
				console.log(res);
				resolve();
			}
		});
	});
};

Services.prototype.getServicesQueueItems = function( startDate, nbDays, lang ) {
	logger.trace("getServicesQueueItems", startDate, nbDays, lang);
	var that = this;
	var endDate = moment(startDate).add(nbDays, 'd').format("YYYY-MM-DD");
	var refServices = {};
	
	function _getQueueItems() {
		return new Promise(function (resolve) {
			var servicesItems = [];

			var search = {
				subject  : that.subject,
				startDate: {'$lte': endDate},
				endDate  : {'$gte': startDate},
				active   : true
			};

			physioDOM.db.collection("services").find(search).toArray(function (err, res) {
				var promises = res.map(function (_service) {
					return new Promise(function (resolve, reject) {
						var service = new Service();
						service.getByID(_service._id)
							.then(function (service) {
								return service.getDetail();
							})
							.then(function (service) {
								return _getItem(service, startDate, endDate);
							})
							.then(function (items) {
								/*
								items.forEach(function(item) {
									console.log(item.start, item.label);
								});
								*/
								resolve(items);
							})
							.catch(function (err) {
								if (err.stack) {
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
	}

	/**
	 * get Lists of services for labels
	 * @type {Array}
	 */
	var refPromises = ["socialServices","healthServices"].map( function(listName) {
		return new Promise( function(resolve) {
			physioDOM.Lists.getListArray( listName )
				.then( function(list) {
					resolve(list.items);
				})
				.catch( function(err) {
					if(err.stack) { 
						console.log(err.stack);
					} else {
						console.log(err);
					}
					resolve( {} );
				});
		});
	});

	return new Promise( function(resolve, reject) {
		Promise.all(refPromises)
			.then(function (refLists) {
				Object.keys(refLists[0]).forEach( function(key) {
					refServices[key] = refLists[0][key];
				});
				Object.keys(refLists[1]).forEach( function(key) {
					refServices[key] = refLists[1][key];
				});
				return _getQueueItems();
			})
			.then(function(items) {
				logger.debug( "found "+items.length+" items" );
				items.forEach( function(item) {
					item.serviceID = item.serviceID.toString();
					item.hash = Hash.sha1(item);
					item.subject = that.subject;
					item.label = refServices[item.label][lang];
				});
				return that.pushAgendaToQueue(items, startDate);
			})
			.then( resolve )
			.catch( function(err) {
				if(err.stack) { console.log(err.stack); }
				reject(err);
			});
	});
};

/**
 * Push agenda events to queue
 * 
 * @param items
 * @param startDate 
 * @returns {*}
 */
Services.prototype.pushAgendaToQueue = function( items, startDate ) {
	var queue = new Queue(this.subject);
	var that = this;
	var msgs = [];
	
	function _markDelete() {
		// console.log("mark all records with a delete flag");
		return new Promise( function(resolve, reject) {
			var search = {subject: that.subject};
			physioDOM.db.collection("servicesPlan").update(search, {$set: {del: true}}, {multi: true}, function (err, nb) {
				if (err) {
					logger.alert(err);
					reject(err);
				} else {
					resolve(nb);
				}
			});
		});
	}
	
	var promises = items.map(function (item) {
		return new Promise(function (resolve ) {
			var search = {
				subject: that.subject,
				hash   : item.hash
			};
			
			physioDOM.db.collection("servicesPlan").findOne(search, function (err, doc) {
				if (doc) {
					physioDOM.db.collection("servicesPlan").update(doc, {$unset: {del: 1}, $set: { new:false }}, function () {
						resolve();
					});
				} else {
					item.new = true;
					physioDOM.db.collection("servicesPlan").insert(item, function () {
						resolve();
					});
				}
			});
		});
	});
	
	function _delMsgs() {
		return new Promise( function(resolve) {
			// create del message for the queue
			var search = {
				subject: that.subject,
				del   : { $exists : 1 }
			};
			// remove records with del field
			physioDOM.db.collection("servicesPlan").find( search ).toArray( function( err, res ) {
				res.forEach( function(item) {
					if(item.startDate >= startDate) {
						var msg = [];
						var leaf = "hhr[" + that.subject + "].agenda[" + item._id + "]";
						msg.push({branch: leaf});
						queue.delMsg(msg);

						msgs.push(msg);
					}
					physioDOM.db.collection("servicesPlan").remove( item , function() {} );
				});
				resolve(msgs);
			});
		});
	}
	
	function _addMsgs() {
		return new Promise( function(resolve) {
			// create add message for the queue
			var search = {
				subject: that.subject,
				del    : {$exists: 0}
			};
			var newAgenda = false;
			
			moment.locale(physioDOM.lang === "en" ? "en-gb" : physioDOM.lang);
			
			physioDOM.db.collection("servicesPlan").find(search).toArray(function (err, res) {
				res.forEach(function (item) {
					// create add message for the queue
					/* jslint bitwise: true */
					var msg = [];
					var leaf = "hhr[" + that.subject + "].agenda[" + item._id + "].";
					newAgenda = newAgenda | item.new;
					
					msg.push({
						name : leaf+"datetime",
						value: moment.tz(item.start,physioDOM.config.timezone).unix(),
						type : "integer"
					});
					msg.push({
						name : leaf+"label",
						value: item.label,
						type : "string"
					});
					msg.push({
						name : leaf+"description",
						value: item.detail || ' ',
						type : "string"
					});
					msg.push({
						name : leaf+"proLastName",
						value: item.provider.family || ' ',
						type : "string"
					});
					msg.push({
						name : leaf+"proFirstName",
						value: item.provider.given || ' ',
						type : "string"
					});
					msg.push({
						name : leaf+"duration",
						value: moment(item.end).diff(moment(item.start),"minutes"),
						type : "integer"
					});

					queue.postMsg(msg);
					msgs.push(msg);
				});
				
				// agenda new is global for one beneficiary
				if(newAgenda) {
					var newMsg = [];
					newMsg.push({
						name : "hhr[" + that.subject + "].agenda.new",
						value: 1,
						type : "integer"
					});
					queue.postMsg(newMsg);
					msgs.push(newMsg);
				}
				resolve( msgs );
			});
		});
	}
	
	return new Promise( function(resolve) {
		_markDelete()
			.then(function () {
				// update and create records
				return Promise.all(promises);
			})
			.then( _delMsgs )
			.then( _addMsgs )
			.then( resolve )
			.catch(function (err) {
				if (err.stack) {
					console.log(err.stack);
				}
				resolve([]);
			});
	});
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
		if( serviceObj._id ) { serviceObj._id = new ObjectID(serviceObj._id); }
		
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