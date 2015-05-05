/**
 * @module queue
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	request = require("request"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var Beneficiary = require("./beneficiary.js");

var logger = new Logger("Queue");

function Queue ( beneficiaryID ) {
	this.subject = beneficiaryID;
	
	this.init = function() {
		logger.trace("init hhr", this.subject );
		var that = this;
		
		return new promise( function( resolve, reject ) {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					beneficiary.biomasterStatus = "pending";
					return beneficiary.save();
				})
				.then( function( beneficiary ) {
					var msg = {
						"server":  physioDOM.config.server.protocol+physioDOM.config.server.name,
						"subject": beneficiary._id,
						"gateway": beneficiary.biomaster,
						"method": "DELETE",
						"init":true,
						"content": [
							{"branch": "hhr[" + beneficiary._id + "]"}
						]
					};
					logger.debug("msg", msg);
					that.send( msg )
						.then( resolve )
						.catch( reject );
				})
				.catch(function (err) {
					logger.error("error", err);
					reject(err);
				});
		});
	};
	
	this.send = function( msg ) {
		return new promise( function( resolve, reject ) {
			if( !physioDOM.config.queue ) {
				logger.info("no queue is available");
				resolve( msg );
			} else {
				logger.trace("send to queue");
				request({
					url    : physioDOM.config.queue + "/msg",
					method : "POST",
					headers: {"content-type": "text/plain"},
					body   : JSON.stringify(msg)
				}, function (err, resp, body) {
					if (err || resp.statusCode === 500) {
						logger.warning("error 500 for gateway ", msg.gateway);
						reject(msg);
					} else {
						if (resp.statusCode === 400) {
							logger.warning("error 400 for gateway ", msg.gateway);
						}
						msg.send = moment.utc().toISOString();
						msg.code = resp.statusCode;
						resolve(msg);
					}
				});
			}
		});
	};

	/**
	 * push delete message array to the queue
	 * @param msg
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.delMsg = function( msg ) {
		var that = this;

		return new promise( function( resolve, reject ) {
			logger.trace("delMsg", msg);
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						var post = {
							"server" : physioDOM.config.server.protocol+physioDOM.config.server.name,
							"subject": beneficiary._id,
							"gateway": beneficiary.biomaster,
							"method" : "DELETE",
							"content": msg
						};
						that.send(post)
							.finally(resolve);
					} else {
						resolve();
					}
				});
		});
	};

	/**
	 * push post message array to the queue
	 * @param msg
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.postMsg = function( msg ) {
		var that = this;

		return new promise( function( resolve, reject ) {
			logger.trace("postMsg");
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						var post = {
							"server" : physioDOM.config.server.protocol+physioDOM.config.server.name,
							"subject": beneficiary._id,
							"gateway": beneficiary.biomaster,
							"method" : "POST",
							"content": msg
						};
						that.send(post)
							.finally(resolve);
					} else {
						resolve();
					}
				});
		});
	};
	
	this.status = function( msg ) {
		var that = this;
		var init = false;
		return new promise( function(resolve, reject) {
			if( !physioDOM.config.queue ) {
				logger.info("no queue is available");
				resolve()
			}
			logger.trace("receive status", msg);
			
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					if( beneficiary.biomasterStatus === "pending" && msg.status === true ) {
						init = true;
					}
					beneficiary.biomasterStatus = msg.status;
					return beneficiary.save();
				})
				.then(function (beneficiary) {
					if( init ) {
						logger.info("initialization");
						// send firstname, messages, agenda, measurements, symptoms ...
						beneficiary.pushFirstName()
							.then( function() {
								return beneficiary.pushMessages();
							})
							.then( function() {
								return beneficiary.pushHistory();
							})
							.then ( function() {
								return beneficiary.symptomsSelfToQueue();
							})
							.then( function() {
								return beneficiary.pushLastDHDFFQ();
							})
							.then( function() {
								return beneficiary.getMeasurePlan(true);
							})
							.then( function() {
								return beneficiary.getSymptomsPlan(true);
							})
							.then( function() {
								return beneficiary.physicalPlanToQueue();
							})
							.then( function() {
								return beneficiary.dietaryPlanToQueue();
							})
							.then( function() {
								logger.info("All data sent for ", beneficiary._id );
								resolve();
							});
					} else {
						logger.info("already initialized");
						resolve();
					}
				})
				.catch( reject );
		});
	};
	
	this.initialize = function( init, beneficiary ) {
		var that = this;
		return new promise( function( resolve, reject ) {
			if( !init ) {
				resolve();
			} else {
				that.sendFirstName()
					.then( function() {
						resolve();
					})
					.catch( reject );
			}
		});
	};
	
	this.sendFirstname = function( beneficiary ) {
		logger.trace("sendFirstname");
		var content = {
			name : "hhr[" + beneficiary._id + "].firstName",
			value: beneficiary.name.given || beneficiary.name.family,
			type : "string"
		};
		var msg = {
			"server" : physioDOM.config.server.protocol+physioDOM.config.server.name,
			"subject": beneficiary._id,
			"gateway": beneficiary.biomaster,
			"method" : "POST",
			"content": [
				JSON.stringify(content)
			]
		};
		return this.send(msg);
	};

	this.sendMessages = function( beneficiary ) {
		logger.trace("sendMessages");
		var content = {
			name : "hhr[" + beneficiary._id + "].firstName",
			value: beneficiary.name.given || beneficiary.name.family,
			type : "string"
		};
		var msg = {
			"server" : physioDOM.config.server.protocol+physioDOM.config.server.name,
			"subject": beneficiary._id,
			"gateway": beneficiary.biomaster,
			"method" : "POST",
			"content": [
				JSON.stringify(content)
			]
		};
		return this.send(msg);
	};

	/**
	 * Receive messages from the queue
	 * 
	 * there is 3 types of messages received from the queue
	 *   - messages read status
	 *   - statement of symptom assessment
	 *   - statement of the measured parameters
	 * 
	 * statements create new beneficiary data record marked "From Home"
	 * 
	 * @param msg
	 * @returns {*|RSVP.Promise}
	 */
	this.receivedMessages = function( msg ) {
		logger.trace("receivedMessages");
		console.log(msg);
		var that = this;
		var leaf = "hhr["+ that.subject +"]";
		return new promise(function (resolve, reject) {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then( function( beneficiary ) {
					// console.log( beneficiary );
					var newDataRecord = { home:true, items: [] };
					switch( msg.type ) {
						case "messageRead":
							var Messages = require('./messages.js');
							var messages = new Messages( beneficiary._id );
							messages.updateStatus( new ObjectID(msg.message.id) )
								.then(resolve)
								.catch(reject );
							break;
						case "symptomsSelf":
						case "symptoms":
							msg.message.scales.forEach( function( item ) {
								newDataRecord.items.push( {
									"text":item.id,
									"value":item.value,
									"category":"symptom"
								});
							});
							beneficiary.createDataRecord( newDataRecord )
								.then( function() {
									// remove the measures
									return that.delMsg([ { branch : leaf + "." + msg.type + "["+ msg.message.id+"]"} ]);
								})
								.then( function() {
									// send new measures history
									return beneficiary.pushHistory("symptoms");
								})
								.then( function() {
									return beneficiary.symptomsSelfToQueue();
								})
								.then( function() {
									resolve(newDataRecord);
								})
								.catch( function(err) {
									logger.warning(err);
									reject(err);
								});;
							break;
						case "measures":
							physioDOM.Lists.getListItemsObj("parameters")
								.then( function( listItems) {
									msg.message.params.forEach(function (item) {
										newDataRecord.items.push({
											"text": item.id,
											"value": item.value,
											"category": listItems[item.id].category,
											"automatic": item.automatic === 1 ? true:false
										});
									});
									beneficiary.createDataRecord(newDataRecord)
										.then(function () {
											// remove the measures
											return that.delMsg([{branch: leaf + ".measures[" + msg.message.id + "]"}]);
										})
										.then(function () {
											// send new measures history
											return beneficiary.pushHistory("measures");
										})
										.then(function () {
											resolve(newDataRecord);
										})
										.catch( function(err) {
											logger.warning(err);
											reject(err);
										});
								});
							break;
						default:
							console.log( "unknown type");
							reject("unknown type");
					}
				});
		});
	};
}

module.exports = Queue;