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

				var createDataRecord = function(currentStatus) {
					return new RSVP.Promise(function(resolve, reject) {
						if (updateItem.validated) {

							var dataRecord = {
								items: []
							};

							switch (currentStatus.name) {
								case 'well':
									dataRecord.items = [
										{category: 'questionnaire', text: 'SF12', value: currentStatus.sf12Score, ref: currentStatus.sf12Answer}
									];
									break;
								case 'nutrition':
									dataRecord.items = [
										{category: 'HDIM', text: 'WEG', value: currentStatus.weight},
										{category: 'HDIM', text: 'LFR', value: currentStatus.lean},
										{category: 'HDIM', text: 'BMI', value: currentStatus.bmi},
										{category: 'questionnaire', text: 'MNA', value: currentStatus.mnaScore, ref: currentStatus.mnaAnswer},
										{category: 'questionnaire', text: 'MNA_MINI', value: currentStatus.mnaSfScore, ref: currentStatus.mnaSfAnswer},
										{category: 'questionnaire', text: 'SNAQ', value: currentStatus.snaqScore, ref: currentStatus.snaqAnswer},
										{category: 'questionnaire', text: 'DHD-FFQ', value: currentStatus.dhdScore, ref: currentStatus.dhdAnswer}
									];
									break;
								case 'activity':
									dataRecord.items = [
										{category: 'HDIM', text: 'DIST', value: currentStatus.stepsNumber}
									];
									break;
								case 'frailty':
									dataRecord.items = [
										{category: 'questionnaire', text: 'CHAIR_TEST', value: currentStatus.chairStandScore, ref: currentStatus.chairStandAnswer}
									];
									break;
							}
							
							beneficiary.createDataRecord(dataRecord, req.session.person.id)
								.then(function() {
									resolve(currentStatus);
								})
								.catch(function(err) {
									logger.trace('Error', err);
									reject(err);
								});
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
						return beneficiary.createEvent('Health status', 'update')
							.then( function() {
								return createDataRecord(current);
							});
					})
					.then(function (current) {
						res.send(current);
						next();
					})
					.catch (function (err) {
						res.send(err.code || 400, err);
						next(false);
					});
				})
				.catch (function (err) {
					// Current status not found: create a new one
					new CurrentStatus().update(updateItem)
						.then(function (current) {
							return beneficiary.createEvent('Health status', 'create')
								.then( function() {
									return createDataRecord(current);
								});
						})
						.then(function (current) {
							res.send(current);
							next();
						})
						.catch (function (err) {
							res.send(err.code || 500, err);
							next(false);
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