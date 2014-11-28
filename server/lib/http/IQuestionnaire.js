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
	}
};

module.exports = IQuestionnaire;