/**
 * @file IQuestionnaire.js
 * @module Http
 */

/* jslint node:true */
"use strict";

var Logger = require("logger");
var logger = new Logger("IQuestionnaire");

/**
 * IBeneficiaries
 *
 * treat http request for beneficiaries
 */
var IQuestionnaire = {

	createQuestionnaire: function(req, res, next ) {
		logger.trace("createQuestionnaire");
		physioDOM.Questionnaires()
			.then( function(questionnaires) {
				if(!req.body) {
					throw( {"message":"entry is empty"});
				}
				try {
					var data = JSON.parse(req.body.toString());
					return questionnaires.createQuestionnaire(data);
				} catch(err) {
					throw { code:405, message:"bad json format"};
				}
			})
			.then( function(questionnaire) {
				res.send(questionnaire);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	updateQuestionnaire: function(req, res, next ) {
		logger.trace("updateQuestionnaire");
		if(!req.body) {
			res.send(400, { error: "empty request"});
			return next(false);
		}
		if( ["administrator","coordinator"].indexOf(req.session.role) === -1 ) {
			res.send(403,  { code:403, message:"not authorized"});
			return next(false);
		}
		try {
			var updateItem = JSON.parse(req.body);
			physioDOM.Questionnaires()
				.then(function (questionnaires) {
					return questionnaires.getQuestionnaireByID(req.params.entryID);
				})
				.then(function (questionnaire) {
					return questionnaire.update(updateItem);
				})
				.then( function (questionnaire ) {
					res.send( questionnaire );
					next();
				})
				.catch(function (err) {
					res.send(err.code || 400, err);
					next(false);
				});
		} catch( err ) {
			res.send(400, { error: "bad json format"});
			next(false);
		}
	}
};

module.exports = IQuestionnaire;