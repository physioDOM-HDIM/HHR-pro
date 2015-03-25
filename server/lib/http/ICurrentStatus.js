/**
 * @file ICurrentStatus.js
 * @module Http
 */

/* jslint node:true */
'use strict';

var Logger        = require('logger');
var RSVP          = require('rsvp');
var ObjectID      = require('mongodb').ObjectID;
var logger        = new Logger('ICurrentStatus');
var CurrentStatus = require('../class/currentStatus');

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

		new CurrentStatus().get(req.params.subject, req.params.name)
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
					updateItem.validatedAuthor = req.session.person.id;	
				}

				var createDataRecord = function(currentStatus) {
					return new RSVP.Promise(function(resolve, reject) {
						if (updateItem.validated) {

							var dataRecord = {
								items: [],
								healthStatus: true
							};

							switch (currentStatus.name) {
								case 'well':

									if(currentStatus.sf36Answer) {
										dataRecord.items.push({category: 'questionnaire', text: 'SF36', value: currentStatus.sf36Score, ref: currentStatus.sf36Answer, comment: currentStatus.commentSf36});
									}

									break;
								case 'nutrition':

									if(currentStatus.weight) {
										dataRecord.items.push({category: 'HDIM', text: 'WEG', value: currentStatus.weight, comment: currentStatus.commentWeight});
									}

									if(currentStatus.lean) {
										dataRecord.items.push({category: 'HDIM', text: 'LFR', value: currentStatus.lean, comment: currentStatus.commentLean});
									}

									if(currentStatus.bmi) {
										dataRecord.items.push({category: 'HDIM', text: 'BMI', value: currentStatus.bmi, comment: currentStatus.commentBmi});
									}

									if(currentStatus.mnaAnswer) {
										dataRecord.items.push({category: 'questionnaire', text: 'MNA', value: currentStatus.mnaScore, ref: currentStatus.mnaAnswer, comment: currentStatus.commentMna});
									}

									if(currentStatus.mnaSfAnswer) {
										dataRecord.items.push({category: 'questionnaire', text: 'MNA_MINI', value: currentStatus.mnaSfScore, ref: currentStatus.mnaSfAnswer, comment: currentStatus.commentMnaSf});
									}

									if(currentStatus.snaqAnswer) {
										dataRecord.items.push({category: 'questionnaire', text: 'SNAQ', value: currentStatus.snaqScore, ref: currentStatus.snaqAnswer, comment: currentStatus.commentSnaq});
									}

									if(currentStatus.dhdAnswer) {
										dataRecord.items.push({category: 'questionnaire', text: 'DHD-FFQ', value: currentStatus.dhdScore, ref: currentStatus.dhdAnswer, comment: currentStatus.commentDhd});
									}
										
									break;
								case 'activity':

									if(currentStatus.stepsNumber) {
										dataRecord.items.push({category: 'HDIM', text: 'DIST', value: currentStatus.stepsNumber, comment: currentStatus.commentStepsNumber});
									}

									break;
								case 'frailty':

									if(currentStatus.chairStandAnswer) {
										dataRecord.items.push({category: 'questionnaire', text: 'CHAIR_TEST', value: currentStatus.chairStandScore, ref: currentStatus.chairStandAnswer, comment: currentStatus.commentchairStand});
									}

									break;
							}

							if(dataRecord.items.length === 0) {
								resolve(currentStatus);
							} else {
								beneficiary.createDataRecord(dataRecord, req.session.person.id)
									.then(function() {
										resolve(currentStatus);
									})
									.catch(function(err) {
										logger.trace('Error', err);
										reject(err);
									});
							}

						}
						else {
							resolve(currentStatus);
						}
					});
				};

				new CurrentStatus().get(beneficiary._id, req.params.name)
					.then(function (current) {
						updateItem._id = current._id;
						current.update(updateItem)
							.then(function (current) {
								console.log( current );
								return beneficiary.createEvent('Health status : '+ current.name, 'update', current._id, req.session.person.id)
									.then( function() {
										return createDataRecord(current);
									});
							})
							.then(function (current) {
								res.send(current);
								next();
							})
							.catch (function (err) {
								updateItem.validated = false;
								current.update(updateItem)
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
					var newCurrentStatus;
					new CurrentStatus().update(updateItem)
						.then(function (current) {
							return beneficiary.createEvent('Health status', 'create', current._id, req.session.person.id)
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

									current.update(updateItem)
										.then(function() {
											res.send(err.code || 500, err);
											next(false);
										})
										.catch(function(err) {
											logger.trace(err);
										})
									
								})

						});
				});
			}
			catch (err) {
				logger.trace('Error', err);
				res.send(500, {error: 'Bad json format'});
				next(false);
			}
		});
	}
};

module.exports = ICurrentStatus;