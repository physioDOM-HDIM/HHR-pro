/**
 * @file questProg.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment"),
	questionnaireSchema = require("./../schema/questionnaireSchema");

var logger = new Logger("questionnairePlan");

/**
 * Manage a beneficiary questionnaire programmation
 *
 * @constructor
 */
function QuestionnairePlan( beneficiaryID ) {
	this.subject = beneficiaryID;

	this.getList = function( ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getList");
			physioDOM.Questionnaires()
				.then(function (questionnaires) {
					return questionnaires.getQuestionnaires(1,100);
				})
				.then(function (questionnaires) {
					var promises = questionnaires.items.map(function (questionnaire) {
						return new promise( function(resolve, reject) {
							var search = {subject: that.subject, ref: questionnaire.name};
							physioDOM.db.collection("questionnairePlan").findOne(search, function (err, result) {
								if(err) {
									var ret = {
										subject: that.subject,
										frequency: "",
										comment: "",
										ref: search.ref,
										date: [ ]
									};
									resolve( ret );
								} else {
									if( result ) {
										resolve(result);
									} else {
										var ret = {
											subject: that.subject,
											frequency: "",
											comment: "",
											ref: search.ref,
											date: [ ]
										};
										resolve( ret );
									}
								}
							});
						});
					});
					RSVP.all(promises)
						.then(function ( programmings ) {
							var result = [];
							programmings.forEach( function( questProg ) {
								result.push(questProg);
							});
							resolve(result);
						});
				});
		});
	};
	
	this.getQuestionnaire = function( ref ) {
		var that = this;

		return new promise( function(resolve,reject) {
			logger.trace("getQuestionnaire");
			var search = { subject: that.subject, ref:ref };
			physioDOM.db.collection("questionnairePlan").findOne( search , function( err, result ) {
				if(err || !result) {
					var ret = {
						subject: that.subject,
						frequency: "",
						comment: "",
						ref: search.ref,
						date: [ ]
					};
					resolve( ret );
				} else {
					resolve(result);
				}
			});
		});
	};
	
	this.addDate = function( ref, programmingDate ) {
		var that = this;
		
		return new promise( function(resolve,reject) {
			logger.trace("addDate", ref, programmingDate.date );
			if( !moment(programmingDate.date,"YYYY-MM-DD").isValid() ) {
				reject( { code:405, message:"bad date format"});
			} else {
				that.getQuestionnaire( ref )
					.then( function( questionnaire ) {
						if(questionnaire.date.indexOf(programmingDate.date) === -1 ) {
							questionnaire.date.push(programmingDate.date);
							questionnaire.date.sort();
							physioDOM.db.collection("questionnairePlan").save( questionnaire, function (err, result) {
								if(err) {
									reject(err);
								} else {
									resolve(questionnaire);
								}
							});
						} else {
							reject( { code:405, message:"date already programmed"});
						}
					});
			}
		});
	};
	
	this.delDate = function( ref, programmingDate) {
		var that = this;

		return new promise( function(resolve,reject) {
			logger.trace("delDate", ref, programmingDate.date);
			
			if( !moment(programmingDate.date,"YYYY-MM-DD").isValid() ) {
				reject( { code:405, message:"bad date format"});
			} else {
				that.getQuestionnaire( ref )
					.then( function( questionnaire ) {
						var indx = questionnaire.date.indexOf(programmingDate.date);
						if( indx !== -1 ) {
							questionnaire.date.splice(indx,1);
							physioDOM.db.collection("questionnairePlan").save(questionnaire, function (err, result) {
								if(err) {
									reject(err);
								} else {
									resolve(questionnaire);
								}
							});
						} else {
							reject( { code:404, message:"date is not programmed"});
						}
					});
			}
		});
	};
	
	this.setQuestionnaire = function( obj ) {
		var that = this;

		return new promise( function(resolve,reject) {
			logger.trace("setQuestionnaire");
			var check = questionnaireSchema.validator.validate( obj, { "$ref":"/Questionnaire.plan"} );
			if( obj.subject !== that.subject.toString()) {
				return reject( { code:405, message:"bad subject _id"});
			}
			if( check.errors.length ) {
				return reject( { error:"bad format", detail: check.errors } );
			} else {
				obj.subject = that.subject;
				var search = { subject: that.subject, ref: obj.ref };
				obj.date.sort();
				physioDOM.db.collection("questionnairePlan").remove( search, function( err, result ) {
					physioDOM.db.collection("questionnairePlan").save(obj, function (err, result) {
						resolve(result);
					});
				});
			}
		});
	};
}

module.exports = QuestionnairePlan;