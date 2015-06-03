/**
 * @file ICurrentStatus.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
'use strict';

var Logger        = require('logger');
var RSVP          = require('rsvp'),
	promise       = RSVP.Promise; 
var ObjectID      = require('mongodb').ObjectID;
var logger        = new Logger('ICurrentStatus');
var CurrentStatus = require('../class/currentStatus');
var moment = require('moment');

/**
 * ICurrentStatus
 *
 * Handles http requests for current status.
 */
var ICurrentStatus = {

	isValidated: function(req, res, next) {
		logger.trace('isValidated', req.session.beneficiary);

		new CurrentStatus().isValidated(req.session.beneficiary)
			.then( function(isValid) {
				res.send({isValid: isValid});
				next();
			})
			.catch(function(err) {
				logger.trace('Error', err);
				res.send(err.code || 400, {error: err});
			});
	},

	get: function(req, res, next) {
		logger.trace('get', req.params.name);

		new CurrentStatus().get(req.session.beneficiary, req.params.name)
			.then( function(current) {
				res.send(current);
				next();
			});
	},

	put: function(req, res, next) {
		if (!req.body) {
			res.send(400, {error: 'Empty request'});
			return next(false);
		}

		physioDOM.Beneficiaries()
		.then(function(beneficiaries) {
			return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary );
		})
		.then(function(beneficiary) {
			
			try {
				var updateItem = JSON.parse(req.body);
				updateItem.subject = beneficiary._id;
				updateItem.name = req.params.name;

				//adding author to health entry
				if(updateItem.validated) {
					updateItem.validated = {
						status:true,
						date: updateItem.validatedDate,
						author: req.session.person.id
					}
					delete updateItem.validatedDate;
					// console.log( updateItem );
				}

				var createDataRecord = function(currentStatus) {
					return new RSVP.Promise(function(resolve, reject) {
						logger.trace( "createDataRecord");
						// console.log( 'Health status : '+ currentStatus.name, 'validate', currentStatus._id, req.session.person.id );
						if (updateItem.validated && updateItem.validated.status) {
							
							var dataRecord = {
								items: [],
								healthStatus: true
							};
							
							if( currentStatus.parameters && Object.keys(currentStatus.parameters).length ) {
								Object.keys(currentStatus.parameters).forEach(function (key) {
									var parameter = currentStatus.parameters[key];
									if( parameter.value ) {
										var item = {
											category: 'measures',
											text    : parameter.name,
											value   : parseFloat(parameter.value),
											comment : parameter.comment
										};
										// console.log("item", item);
										dataRecord.items.push(item);
									}
								});
							}
							
							if( Object.keys(currentStatus.questionnaires).length ) {
								Object.keys(currentStatus.questionnaires).forEach( function( key ) {
									var questionnaire = currentStatus.questionnaires[key];
									if( questionnaire.score !== null ) {
										var item = {
											category: 'questionnaire',
											text    : questionnaire.name,
											value   : questionnaire.score,
											comment : questionnaire.comment,
											ref     : questionnaire.answerID
										};
										dataRecord.items.push(item);
									}
								});
							}
							
							// console.log(dataRecord);
							
							beneficiary.createEvent('Health status : '+ currentStatus.name, 'validate', currentStatus._id, req.session.person.id)
								.then( function() {
									if (dataRecord.items.length === 0) {
										resolve(currentStatus);
									} else {
										beneficiary.createDataRecord(dataRecord, req.session.person.id)
											.then(function () {
												resolve(currentStatus);
											})
											.catch(function (err) {
												logger.error(err.stack ? err.stack : err);
												reject(err);
											});
									}
								});
						}
						else {
							console.log( currentStatus );
							resolve(currentStatus);
						}
					});
				};

				new CurrentStatus().get(beneficiary._id, req.params.name)
					.then(function (current) {
						updateItem._id = current._id;
						current.update(updateItem, req.session.person.id)
							.then(function (current) {
								var log = {
									subject   : beneficiary._id,
									datetime  : moment().toISOString(),
									source    : req.session.person.id,
									collection: "currentStatuses",
									action    : current.validated && current.validated.status?"validate":"update",
									what      : current
								};
								return logPromise(log)
									.then( function() {
										console.log("create Event");
										return beneficiary.createEvent('Health status : ' + current.name, 'update', current._id, req.session.person.id);
									})
									.then( function() {
										return createDataRecord(current);
									})
									.catch( function(err) {
										console.log(err.stack);
									});
							})
							.then(function (current) {
								res.send(current);
								next();
							})
							.catch (function (err) {
								console.log( JSON.stringify(err.stack,"",4) );
								updateItem.validated = { status:false };
								current.update(updateItem, req.session.person.id)
									.then(function() {
										res.send(err.code || 400, err);
										next(false);
									})
									.catch(function(err) {
										res.send(err.code || 400, err);
										next(false);
									});
							});
				})
				.catch (function (err) {
					// Current status not found: create a new one
					new CurrentStatus().update(updateItem, req.session.person.id)
						.then(function (current) {
							console.log( "validated ? ", current.validated );
							var log = {
								subject   : beneficiary._id,
								datetime  : moment().toISOString(),
								source    : req.session.person.id,
								collection: "currentStatuses",
								action    : current.validated && current.validated.status?"validate":"update",
								what      : current
							};
							return logPromise(log)
								.then( function() {
									return beneficiary.createEvent('Health status : ' + current.name, 'create', current._id, req.session.person.id)
								})
								.then( function() {
									return createDataRecord(current);
								});
						})
						.then(function (current) {
							res.send(current);
							next();
						})
						.catch (function (err) {
							//getting newest current status to change validate if datarecord is not sended
							new CurrentStatus().get(beneficiary._id, req.params.name)
								.then(function(current) {

									updateItem._id = current._id;
									updateItem.validated = false;

									current.update(updateItem, req.session.person.id)
										.then(function() {
											res.send(err.code || 500, err);
											next(false);
										})
										.catch(function(err) {
											logger.trace(err);
										});
								})

						});
				});
			}
			catch (err) {
				logger.trace('Error', err);
				if(err.stack) { logger.warning(err.stack); }
				res.send(500, {error: 'Bad json format'});
				next(false);
			}
		});
	}
};

function logPromise(log) {
	return new promise(function (resolve, reject) {
		physioDOM.db.collection("journal").save(log, function (err) {
			resolve(log);
		});
	});
}

module.exports = ICurrentStatus;