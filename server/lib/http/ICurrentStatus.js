/**
 * @file ICurrentStatus.js
 * @module Http
 */

/* jslint node:true */
'use strict';

var Logger        = require('logger');
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

					new CurrentStatus().get(beneficiary._id, req.params.name)
						.then(function (current) {
							updateItem._id = current._id;
							current.update(updateItem)
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
									res.send(current);
									next();
								})
								.catch (function (err) {
									res.send(err.code || 400, err);
									next(false);
								});
						});
				}
				catch (err) {
					res.send(400, {error: 'Bad json format'});
					next(false);
				}
			});
	}
};

module.exports = ICurrentStatus;