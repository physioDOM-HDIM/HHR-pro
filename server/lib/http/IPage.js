/**
 * @file IPage.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IList
 *
 * treat http request about lists
 */

var swig = require("swig"),
	Logger = require("logger"),
	RSVP = require("rsvp"),
	promise = RSVP.Promise,
	moment = require("moment"),
	ObjectID = require("mongodb").ObjectID;

var CurrentStatus = require('../class/currentStatus.js');
// var DOCUMENTROOT= "/home/http/physiodom";
var DOCUMENTROOT=require("path").join(__dirname,"../../../");

var logger = new Logger("IPage");
var i18n = new(require('i18n-2'))({
	// setup some locales - other locales default to the first locale
	devMode: true,
	locales: ["en", "es", "nl", "fr"]
});

/**
 * IPage
 *
 * IPage is the http interface that manages the urls of the pages seen in the browser
 *
 * @constructor
 */
function IPage() {
	var lang;

	function init(req) {
		lang = req.session.lang || req.cookies.lang || req.params.lang || "en";
		i18n.setLocale(lang);

		swig.setDefaults({cache: false});
		swig.setFilter("i18n", function (input, idx) {
			// console.log("input", input, idx);
			return i18n.__(input);
		});
		swig.setFilter("push", function (arr, val) {
				arr.push(val);
				return arr;
		});
		swig.setFilter("pop", function (arr) {
				arr.pop();
				return arr;
		});
	}

	function convertDate(strDate) {
		return strDate ? moment(strDate, "YYYY-MM-DD").format(moment.localeData(lang).longDateFormat("L")) : strDate;
	}

	function promiseList(listName) {
		return physioDOM.Lists.getList(listName, lang)
			.then(function(list) {
				var result = {};
				result[listName] = list;
				return result;
			})
			.catch(function() {
				var result = {};
				result[listName] = {};
				return result;
			});
	}

	function promiseListArray(listName) {
		return physioDOM.Lists.getListArray(listName, lang)
			.then(function(list) {
				var result = {};
				result[listName+"Array"] = list;
				return result;
			})
			.catch(function() {
				var result = {};
				result[listName+"Array"] = {};
				return result;
			});
	}
	
	/**
	 * Main Layout
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.ui = function(req, res, next) {
		logger.trace("ui");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};
		
		req.session.getPerson()
			.then(function(session) {
				logger.debug("person", session.person);
				data.account = {
						firstname: session.person.item.name.given.slice(0, 1).toUpperCase(),
						lastname: session.person.item.name.family
					};
				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/ui.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			});
	};

	// -------------- Directory pages ---------------------
	
	/**
	 * Directory list
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.directoryList = function(req, res, next) {
		logger.trace("Directory List");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};

		var promises = [
			"perimeter",
			"job",
			"role"
		].map(promiseList);

		RSVP.all(promises)
			.then(function(lists) {
				lists.forEach(function(list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});
				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/directory.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * Directory Create and update
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.directoryUpdate = function(req, res, next) {
		logger.trace("Directory update");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};

		var promises = [
			"system",
			"use",
			"role",
			"job",
			"communication",
			"perimeter"
		].map(promiseList);

		RSVP.all(promises)
			.then(function(lists) {
				lists.forEach(function(list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});
				return physioDOM.Directory();
			})
			.then(function(directory) {
				return directory.getAdminEntryByID(req.params.professionalID);
			})
			.then(function(professional) {
				logger.debug("data", JSON.stringify(data, null, 4));
				logger.debug("prof ", professional);
				if (professional) {
					data.professional = professional;
				}
				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/directoryUpdate.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	// -------------- Beneficiaries pages ---------------------
	
	/**
	 * Beneficiary create and update
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.beneficiaryCreate = function(req, res, next) {
		logger.trace("beneficiaryCreate");
		var html;

		init(req);

		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};

		var promises = [
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"disability",
			"communication",
			"profession",
			"perimeter",
			"nutritionalStatus",
			"generalStatus"
		].map( promiseList);

		var promisesArray = [
			"job"
		].map( promiseListArray);

		RSVP.all(promises)
			.then( function(lists) {
				lists.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});

				return RSVP.all(promisesArray);
			}).then (function(listsArray) {
				listsArray.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				var beneficiaryID = req.params.beneficiaryID?req.params.beneficiaryID:req.session.beneficiary;
				return beneficiaries.getBeneficiaryAdminByID( req.session, beneficiaryID );
			})
			.then( function(beneficiary) {
				// logger.debug("data", data);
				// logger.debug("bene ", beneficiary );
				if(beneficiary){
					data.beneficiary = beneficiary;
					if(data.beneficiary.address){
						data.beneficiary.address.forEach( function(address){
							if(address.line && address.line.length > 0){
								//To display with line break in the textarea
								address.line = address.line.join("\n");
							}
						});
					}

					//Format date to follow the locale
					data.beneficiary.birthdate = convertDate(data.beneficiary.birthdate);
					if(data.beneficiary.entry){
						data.beneficiary.entry.startDate  = data.beneficiary.entry.startDate;
						data.beneficiary.entry.plannedEnd = data.beneficiary.entry.plannedEnd;
						data.beneficiary.entry.endDate    = data.beneficiary.entry.endDate;
					}
				}

				return beneficiary._id ? beneficiary.getProfessionals() : null;
			}).then(function(professionals){
				if( professionals ){
					data.beneficiary.professionals = professionals;
				}

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/beneficiaryCreate.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * get the beneficiaries list
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.beneficiaries = function(req, res, next) {
		logger.trace("beneficiarySelect");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};
		
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					if(req.session && req.session.beneficiary) {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					} else { 
						throw( { code:404, message:"no beneficiary selected"});
					}
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
				})
				.finally(function () {
					physioDOM.Lists.getList("perimeter", lang)
						.then(function (list) {
							if (list) {
								data.perimeter = list;
							}

							html = swig.renderFile(DOCUMENTROOT + '/static/tpl/beneficiaries.htm', data, function (err, output) {
								if (err) {
									console.log("error", err);
									console.log("output", output);
									res.write(err);
									res.end();
									next();
								} else {
									sendPage(output, res, next);
								}
							});
						})
						.catch(function (err) {
							logger.error(err);
							res.write(err);
							res.end();
							next();
						});
				});
		
	};

	/**
	 * Beneficiary overview
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	this.beneficiaryOverview = function(req, res, next) {
		logger.trace("beneficiaryOverview");
		var html, beneficiary;
		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};
		if( req.params.beneficiaryID !== "overview") {
			req.session.beneficiary = new ObjectID(req.params.beneficiaryID);
		}
		if(!req.session.beneficiary) {
			logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		}

		var promisesArray = [
			"role",
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"disability",
			"communication",
			"profession",
			"perimeter",
			"job"
		].map( promiseListArray);

		RSVP.all(promisesArray)
			.then( function(lists) {
				lists.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});
				return req.session.save();
			})
			.then( function(session) {
				return physioDOM.Beneficiaries();
			})
			.then( function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then( function( beneficiary ) {
				data.beneficiary = beneficiary;
				return beneficiary._id ? beneficiary.getProfessionals() : null;
			}).then(function(professionals){
				if( professionals ){
					data.beneficiary.professionals = professionals;
				}
				console.log("data",JSON.stringify(data,null,4));
				
				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/beneficiaryOverview.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	// -------------- Lists pages ---------------------

	/**
	 * Lists manager
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.listsManager = function(req, res, next) {
		logger.trace("listsManager");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};
		
		// nested lists
		var promises = [
			"unity",
			"job"
		].map(promiseList);

		RSVP.all(promises)
			.then(function(lists) {
				lists.forEach(function(list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});
				
				physioDOM.Lists.getLists(1, 100, true)
					.then(function(lists) {
						data.lists = lists;
						data.lang = lang;
						// logger.debug("DATA", data);

						html = swig.renderFile(DOCUMENTROOT+'/static/tpl/listsManager.htm', data, function(err, output) {
							if (err) {
								console.log("error", err);
								console.log("output", output);
								res.write(err);
								res.end();
								next();
							} else {
								sendPage(output, res, next);
							}
						});
					});
			}).catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * return the lists page
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.lists = function(req, res, next) {
		logger.trace("lists");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};

		var promises = [
			"communication",
			"unity",
			"job"
		].map(promiseList);

		RSVP.all(promises)
			.then(function(lists) {
				lists.forEach(function (list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});
				
				physioDOM.Lists.getLists(1, 100, true)
					.then(function (lists) {
						data.lists = lists;
						data.lang = lang;
						//logger.debug("DATA", data);

						html = swig.renderFile(DOCUMENTROOT+'/static/tpl/lists.htm', data, function (err, output) {
							if (err) {
								console.log("error", err);
								console.log("output", output);
								res.write(err);
								res.end();
								next();
							} else {
								sendPage(output, res, next);
							}
						});
					});
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * return a list page
	 * 
	 * the list name is given by req.params.listName
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.list = function(req, res, next) {
		logger.trace("lists");
		var html;

		init(req);
		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false
		};

		var promises = [
			"communication",
			"unity",
			"job"
		].map(promiseList);

		RSVP.all(promises)
			.then(function(lists) {
				lists.forEach(function (list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});

				physioDOM.Lists.getList(req.params.listName)
					.then(function (list) {
						data.list = list;
						data.lang = lang;
						logger.debug("DATA", data);

						html = swig.renderFile(DOCUMENTROOT+'/static/tpl/list.htm', data, function (err, output) {
							if (err) {
								console.log("error", err);
								console.log("output", output);
								res.write(err);
								res.end();
								next();
							} else {
								sendPage(output, res, next);
							}
						});
					});
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	// -------------- Questionnaires pages ---------------------
	
	/**
	 * Questionnaire
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.questionnaires = function(req, res, next) {
		logger.trace("questionnaires");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Questionnaires()
			.then(function(questionnaires){
				return questionnaires.getQuestionnaires();
			})
			.then( function(questionnaires) {
				data.questionnaires = questionnaires;
				data.lang = lang;
				//logger.debug("DATA", data);
				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/questionnaireSelection.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};
	
	/**
	 * Questionnaire
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.createQuestionnaire = function(req, res, next) {
		logger.trace("createQuestionnaire");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Questionnaires()
			.then(function(questionnaires){
				if(req.params.questionnaireName){
					return questionnaires.getQuestionnaireByName(req.params.questionnaireName);
				}
				return null;
			})
			.then( function(questionnaire) {
				if (questionnaire) {
					data.questionnaire = questionnaire;
				}
				data.lang = lang;

				html = swig.renderFile(DOCUMENTROOT + '/static/tpl/questionnaireCreation.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			});
	};

	/**
	 * Questionnaire Overview
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.questionnaireOverview = function(req, res, next) {
		logger.trace("questionnaireOverview");
		var html;
		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Questionnaires()
			.then(function(questionnaires){
				return questionnaires.getQuestionnaireByName(req.params.questionnaireName);
			})
			.then( function(questionnaire) {
				data.questionnaire = questionnaire;
				data.lang = lang;
				//logger.debug("DATA", data);
				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/questionnaireOverview.htm', data, function (err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * Questionnaire answers page.
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	this.questionnaireAnswers = function(req, res, next) {
		var id = req.params.entryID;
		logger.trace('questionnaireAnswers', id);

		init(req);
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false
		};

		physioDOM.QuestionnaireAnswer()
			.then(function(questionnaireAnswer) {
				return questionnaireAnswer.getById(new ObjectID(id));
			})
			.then(function(answer) {
				data.answer = answer;
				return physioDOM.Questionnaires();
			})
			.then(function(questionnaires) {
				return questionnaires.getQuestionnaireByID(data.answer.ref);
			})
			.then(function(questionnaire) {
				data.questionnaire = questionnaire;
				data.lang = lang;
				render('/static/tpl/questionnaireAnswer.htm', data, res, next);
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * DataRecording
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.dataRecord = function(req, res, next) {
		logger.trace("DataRecording");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};
		
		if( !req.session.beneficiary ) {
			logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary._id ? beneficiary.getProfessionals() : null;
				}).then(function (professionals) {
					if (professionals) {
						data.professionals = professionals;
					}

					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/dataRecord.htm', data, function (err, output) {
						if (err) {
							console.log("error", err);
							console.log("output", output);
							res.write(err);
							res.end();
							next();
						} else {
							sendPage(output, res, next);
						}
					});
				})
				.catch(function (err) {
					logger.error(err);
					res.write(err);
					res.end();
					next();
				});
		}
	};


	this.dataRecordDetail = function(req, res, next) {
		logger.trace("DataRecordingEdit");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				return beneficiary.getCompleteDataRecordByID(req.params.dataRecordID);
			})
			.then(function(record) {
				// jsut for test, otherwise read locale from session
				moment.locale("en_gb");

				data.dataRecordItems = record;
				data.dataRecordItems.datetime = moment(data.dataRecordItems.datetime).format("L LT");
				data.view = 'update';
				data.lang = lang;

				console.log("dataRecordItems :", data.dataRecordItems);

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/dataRecordEdit.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});

			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	this.dataRecordCreate = function(req, res, next) {
		logger.trace("DataRecordingCreate");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		if( !req.session.beneficiary ) {
			logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					data.view = 'create';
					data.lang = lang;
					// jsut for test, otherwise read locale from session

					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/dataRecordEdit.htm', data, function (err, output) {
						if (err) {
							console.log("error", err);
							console.log("output", output);
							res.write(err);
							res.end();
							next();
						} else {
							sendPage(output, res, next);
						}
					});

				})
				.catch(function (err) {
					logger.error(err);
					res.write(err);
					res.end();
					next();
				});
		}
	};


	/**
	 * Message - Message to Home
	 */

	this.messageList = function(req, res, next) {
		logger.trace("messageList");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		if( !req.session.beneficiary ) {
			logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary._id ? beneficiary.getProfessionals() : null;
				}).then(function (professionalList) {
					if (professionalList) {
						data.professionalList = professionalList;
					}
					data.lang = lang;

					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/messageList.htm', data, function (err, output) {
						if (err) {
							console.log("error", err);
							console.log("output", output);
							res.write(err);
							res.end();
							next();
						} else {
							sendPage(output, res, next);
						}
					});

				})
				.catch(function (err) {
					logger.error(err);
					res.write(err);
					res.end();
					next();
				});
		}
	};

	this.messageCreate = function(req, res, next) {
		logger.trace("messageCreate");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		if( !req.session.beneficiary ) {
			logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {

			var promises = {
				beneficiaries: physioDOM.Beneficiaries(),
				session: req.session.getPerson()
			};

			RSVP.hash(promises)
				.then(function(result) {
					data.session = result.session;
					console.log(data.session);
					return result.beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary._id ? beneficiary.getProfessionals() : null;
				}).then(function (professionalList) {
					if (professionalList) {
						data.professionalList = professionalList;
					}
					data.lang = lang;

					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/messageCreate.htm', data, function (err, output) {
						if (err) {
							console.log("error", err);
							console.log("output", output);
							res.write(err);
							res.end();
							next();
						} else {
							sendPage(output, res, next);
						}
					});

				})
				.catch(function (err) {
					logger.error(err);
					res.write(err);
					res.end();
					next();
				});
		}
	};


	// -------------- Basic health services pages ---------------------

	/**
	 * Basic health services Overview
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.basicHealthServices = function(req, res, next) {
		logger.trace('basicHealthServices');

		init(req);
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false
		};

		swig.renderFile(DOCUMENTROOT+'/static/tpl/healthServices.htm', data, function(err, output) {
			if (err) {
				console.log("error", err);
				console.log("output", output);
				res.write(err);
				res.end();
				next();
			} else {
				sendPage(output, res, next);
			}
		});
	};


	this.physiologicalData = function(req, res, next) {
		logger.trace("PhysiologicalData");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				logger.trace(data.beneficiary);
				data.lang = lang;

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/physiologicalData.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});

			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * Basic health services creation page
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.basicHealthServiceCreate = function(req, res, next) {
		logger.trace('basicHealthServiceCreate');

		init(req);
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false
		};

		swig.renderFile(DOCUMENTROOT + '/static/tpl/healthServiceCreate.htm', data, function (err, output) {
			if (err) {
				console.log("error", err);
				console.log("output", output);
				res.write(err);
				res.end();
				next();
			} else {
				sendPage(output, res, next);
			}
		});
	};

	/**
	 * Current health status page
	 * @param  req
	 * @param  res
	 * @param  next
	 */
	this.currentHealthStatus = function(req, res, next) {
		var name = req.params.name;
		logger.trace('currentHealthStatus', name);

		init(req);
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false
		};

		if (!req.session.beneficiary) {
			logger.debug("No beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		}
		else {
			new CurrentStatus().get(req.session.beneficiary, name)
				.then( function(status) {
					data.status = status;

					render('/static/tpl/current/' + name + '.htm', data, res, next);
				})
				.catch(function(err) {
					if (err.code && err.code === 404) {
						data.status = {};
						render('/static/tpl/current/' + name + '.htm', data, res, next);
					}
					else {
						logger.error(err);
						res.write(err);
						res.end();
						next();
					}
				});
		}
	};

	this.prescriptionDataGeneral = function(req, res, next) {
		logger.trace("PrescriptionDataGeneral");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.title = 'General Data';
				data.category = 'General';
				data.parameterList = 'parameters';
				// jsut for test, otherwise read locale from session

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/prescriptionData.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});

			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	this.prescriptionDataHDIM = function(req, res, next) {
		logger.trace("PrescriptionDataHDIM");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.title = 'HDIM Data';
				data.category = 'HDIM';
				data.parameterList = 'parameters';
				// jsut for test, otherwise read locale from session

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/prescriptionData.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});

			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	this.prescriptionDataSymptom = function(req, res, next) {
		logger.trace("PrescriptionDataSymptom");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.title = 'Symptom Data';
				data.category = '';
				data.parameterList = 'symptom';

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/prescriptionData.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});

			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};


	this.prescriptionQuestionnaire = function(req, res, next) {
		logger.trace("PrescriptionQuestionnaire");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false
		};

		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.title = 'Questionnaires';
				// jsut for test, otherwise read locale from session

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/prescriptionQuestionnaire.htm', data, function(err, output) {
					if (err) {
						console.log("error", err);
						console.log("output", output);
						res.write(err);
						res.end();
						next();
					} else {
						sendPage(output, res, next);
					}
				});

			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * Render a page using a template and given data.
	 * 
	 * @param  {String}   tpl  Path of the template (relative to DOCUMENT ROOT)
	 * @param             data Data used in the template
	 * @param  {Object}   res 
	 * @param  {Function} next
	 */
	function render(tpl, data, res, next) {
		swig.renderFile(DOCUMENTROOT + tpl, data, function (err, output) {
			if (err) {
				console.log('error', err);
				console.log('output', output);
				res.write(err);
				res.end();
				next();
			}
			else {
				sendPage(output, res, next);
			}
		});
	}

	/**
	 * Send the page to the browser
	 *
	 * The html code of the page is in `html`
	 *
	 * @param html
	 * @param res
	 * @param next
	 */
	function sendPage(html, res, next) {
		logger.trace("sendPage");
		res.writeHead(200, {
			'Content-Length': Buffer.byteLength(html),
			'Content-Type': 'text/html'
		});

		res.write(html);
		res.end();
		next();
	}
}

module.exports = new IPage();
