/**
 * @module queue
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	request = require("request"),
	moment = require("moment"),
	ObjectID = require("mongodb").ObjectID;

var logger = new Logger("Queue");

function Queue ( session ) {
	this.subject = session.beneficiary;
	this.session = session;
	
	this.init = function() {
		logger.trace("init hhr");
		var that = this;
		
		return new promise( function( resolve, reject ) {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(that.session, that.subject.toString());
				})
				.then(function (beneficiary) {
					var msg = {
						"server":  physioDOM.config.server,
						"subject": beneficiary._id,
						"gateway": beneficiary.biomaster,
						"method": "DELETE",
						"content": [
							{"branch": "hhr[" + beneficiary._id + "]"}
						]
					};
					logger.debug("msg", msg);
					// send all messages, symptoms, agenda, ....
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
}

module.exports = Queue;