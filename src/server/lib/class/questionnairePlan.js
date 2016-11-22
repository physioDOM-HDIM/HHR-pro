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

	this.getList = function(lang) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getList", lang);
			physioDOM.Lists.getList( 'questionnaire' )
				.then(function (questionnaires) {
					// logger.debug( "test",questionnaires );
					var promises = questionnaires.items.map(function (questionnaire) {
						if(questionnaire.active) {
							return new promise(function (resolve, reject) {
								var search = {subject: that.subject, ref: questionnaire.ref};
								physioDOM.db.collection("questionnairePlan").findOne(search, function (err, result) {
									// logger.debug("test2", result);
									if (err || !result) {
										var ret = {
											subject  : that.subject,
											frequency: "",
											comment  : "",
											ref      : questionnaire.ref,
											date     : [],
											label    : questionnaire.label[lang] || questionnaire.label.en
										};
										resolve(ret);
									} else {
										result.label = questionnaire.label;
										resolve(result);
									}
								});
							});
						}
					});
					RSVP.all(promises)
						.then(function ( programmings ) {
							var result = [];
							// remove null value from the list
							programmings.forEach( function( questProg ) {
								if(questProg) { result.push(questProg); }
							});
							logger.debug( result );
							resolve(result);
						});
				});
		});
	};
	
	this.getQuestionnaire = function( ref ) {
		var that = this;
		
		return new promise( function(resolve,reject) {
			logger.trace("getQuestionnaire",that.subject, ref);
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
	
	this.setQuestionnaire = function( obj, professionalID ) {
		var that = this;

		return new promise( function(resolve,reject) {
			logger.trace("setQuestionnaire");
			var check = questionnaireSchema.validator.validate( obj, { "$ref":"/Questionnaire.plan"} );
			if( check.errors.length ) {
				return reject( { error:"bad format", detail: check.errors } );
			} else {
				obj.subject = that.subject;
				if( !obj.comment ) { obj.comment = ""; }
				if( !obj.frequency ) { obj.frequency = ""; }
				if( obj.date) { 
					obj.date.sort(); 
				} else {
					obj.date = [];
				}
				that.getQuestionnaire( obj.ref )
					.then( function(questionnaire) {
						// todo : check update
						
						var modified = false;
						if( questionnaire.comment !== obj.comment ) { modified = true; }
						if( questionnaire.frequency !== obj.frequency ) { modified = true; }
						if( JSON.stringify(questionnaire.date) !== JSON.stringify( obj.date )) { modified = true; }
						
						if( !modified) {
							resolve(questionnaire);
						} else {
							questionnaire.date = obj.date;
							questionnaire.comment = obj.comment;
							questionnaire.frequency = obj.frequency;
							questionnaire.datetime = moment().toISOString();
							questionnaire.source = professionalID;
							physioDOM.db.collection("questionnairePlan").save(questionnaire, function (err, result) {
								if (err) { reject(err); }
								else {
									var log = { 
										subject: questionnaire.subject,
										datetime: questionnaire.datetime,
										source: questionnaire.source,
										collection: "questionnairePlan",
										action: isNaN(result)?"create":"update",
										what: questionnaire
									};
									physioDOM.db.collection("journal").save( log, function() {
										resolve(questionnaire);
									});
								}
							});
						}
					})
					.catch( function(err) {
						if(err.stack) { console.log( err.stack ); }
						reject(err);
					});
				/*
				physioDOM.db.collection("questionnairePlan").remove( search, function( err, result ) {
					physioDOM.db.collection("questionnairePlan").save(obj, function (err, result) {
						resolve(result);
					});
				});
				*/
			}
		});
	};
}

module.exports = QuestionnairePlan;