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
		logger.trace("init hhr");
		var that = this;
		
		return new promise( function( resolve, reject ) {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					beneficiary.biomasterStatus = false;
					return beneficiary.save();
				})
				.then( function( beneficiary ) {
					var msg = {
						"server":  physioDOM.config.server,
						"subject": beneficiary._id,
						"gateway": beneficiary.biomaster,
						"method": "DELETE",
						"content": [
							{"branch": "hhr['" + beneficiary._id + "']"}
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
			logger.trace("send to queue");
			request( {
				url: physioDOM.config.queue+"/msg",
				method:"POST",
				headers: { "content-type":"text/plain"},
				body: JSON.stringify(msg)
			}, function(err, resp, body) {
				if( err || resp.statusCode === 500) {
					logger.warning("error 500 for gateway ",msg.gateway);
					reject(msg);
				} else {
					if( resp.statusCode === 400 ) {
						logger.warning("error 400 for gateway ",msg.gateway);
					}
					msg.send = moment.utc().toISOString();
					msg.code = resp.statusCode;
					resolve(msg);
				}
			});
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
			logger.trace("postMsg", msg);
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						var post = {
							"server" : physioDOM.config.server,
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
			logger.trace("postMsg", msg);
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					if (beneficiary.biomasterStatus) {
						var post = {
							"server" : physioDOM.config.server,
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
		logger.trace("receive status", msg);
		var that = this;
		var init = false;
		return new promise( function(resolve, reject) {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then(function (beneficiary) {
					if( !beneficiary.biomasterStatus ) {
						init = true;
					}
					beneficiary.biomasterStatus = msg.status;
					return beneficiary.save();
				})
				.then(function () {
					if( init ) {
						logger.info("initialization");
						// send firstname, messages, agenda, measurements, symptoms ...
					} else {
						logger.info("already initialized");
					}
					resolve();
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
			"server" : physioDOM.config.server,
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
			"server" : physioDOM.config.server,
			"subject": beneficiary._id,
			"gateway": beneficiary.biomaster,
			"method" : "POST",
			"content": [
				JSON.stringify(content)
			]
		};
		return this.send(msg);
	};
	
	this.receivedMessages = function( msg ) {
		logger.trace("receivedMessages");
		console.log(msg);
		var that = this;
		return new promise(function (resolve, reject) {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getHHR( that.subject );
				})
				.then( function( beneficiary ) {
					// console.log( beneficiary );
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
						case "measures":
							console.log("create a new dataRecord");
							resolve();
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