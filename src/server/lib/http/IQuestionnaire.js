/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

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
	},
	
	getList : function(req, res, next ) {
		logger.trace("Questionnaire list");
		physioDOM.Questionnaires()
			.then(function(questionnaires){
				return questionnaires.getQuestionnaires();
			})
			.then( function(questionnaire) {
				res.send( questionnaire );
				next();
			});
	},
	
	getQuestionnaire : function(req, res, next) {
		logger.trace("Questionnaire ", req.params.entryID );
		physioDOM.Questionnaires()
			.then(function(questionnaires){
				return questionnaires.getQuestionnaireByID(req.params.entryID);
			})
			.then( function(questionnaire) {
				res.send( questionnaire );
				next();
			});
	}
};

module.exports = IQuestionnaire;
