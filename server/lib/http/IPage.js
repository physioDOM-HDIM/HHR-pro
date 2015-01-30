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
	Menu     = require('../class/menu'),
	URL = require("url"),
	ObjectID = require("mongodb").ObjectID;

var CurrentStatus = require('../class/currentStatus.js');
var Menu = require('../class/menu.js');
// var DOCUMENTROOT= "/home/http/physiodom";
var DOCUMENTROOT=require("path").join(__dirname,"../../../");

var logger = new Logger("IPage");
var i18n = new(require('i18n-2'))({
	// setup some locales - other locales default to the first locale
	devMode: true,
	locales: ["en", "es", "nl", "fr"],
	extension:".json"
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
		if(req.session) {
			console.log("test");
			lang = req.session.lang || req.cookies.lang || req.params.lang || physioDOM.lang;
		} else {
			lang = req.cookies.lang || req.params.lang || physioDOM.lang;
		}
		logger.info("lang", lang);
		
		i18n.setLocale(lang);
		moment.locale(req.cookies.lang=="en"?"en-gb":req.cookies.lang)
		
		swig.setDefaults( {cache: physioDOM.config.cache} );
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
		swig.setFilter("date", function( date ) {
			return moment(date).format("L");
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
	
	this.login = function( req, res, next ) {
		logger.trace("login page");
		var html;
		
		init(req);
		
		logger.trace("login page 2");
		html = swig.renderFile(DOCUMENTROOT+'/static/index.htm', [], function(err, output) {
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
		
		new Menu().getMenu( req.session.role )
			.then( function( menu ) {
				// logger.debug("menu",req.session.role, menu);
				var data = {
					admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
					items: menu
				};

				req.session.getPerson()
					.then(function(session) {
						// logger.debug("person", session.person);
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
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/directory' }
		};

		var promises = [
			"perimeter",
			"job",
			"role"
		].map(promiseList);

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return RSVP.all(promises);
			})
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
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/directory' }
		};

		var promises = [
			"system",
			"use",
			"role",
			"job",
			"communication",
			"organizationType",
			"perimeter"
		].map(promiseList);

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				data.rights.read = data.rights.write;
				return RSVP.all(promises);
			})
			.then(function(lists) {
				lists.forEach(function(list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});
				console.log( data.organizationType );
				return physioDOM.Directory();
			})
			.then(function(directory) {
				return directory.getAdminEntryByID(req.params.professionalID);
			})
			.then(function(professional) {
				if (professional) {
					data.professional = professional;
				}
				data.sessionID = req.session.person.id;
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
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/beneficiaries' }
		};

		var promises = [
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"disability",
			"diagnosis",
			"destination",
			"communication",
			"profession",
			"perimeter",
			"nutritionalStatus",
			"generalStatus"
		].map( promiseList);

		var promisesArray = [
			"job"
		].map( promiseListArray);

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return RSVP.all(promises);
			})
			.then( function(lists) {
				lists.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});

				return RSVP.all(promisesArray);
			}).then (function(listsArray) {
				listsArray.forEach( function(list ) {
					data[Object.keys(list)]=list[Object.keys(list)];
				});
			})
			.then(function(professionals){
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
	 * Beneficiary create and update
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.beneficiaryUpdate = function(req, res, next) {
		logger.trace("beneficiaryUpdate");
		var html;

		init(req);

		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/beneficiaries' }
		};

		var promises = [
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"disability",
			"diagnosis",
			"destination",
			"communication",
			"profession",
			"perimeter",
			"nutritionalStatus",
			"generalStatus"
		].map( promiseList);

		var promisesArray = [
			"job"
		].map( promiseListArray);

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return RSVP.all(promises);
			})
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
			})
			.then(function(professionals){
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
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/beneficiaries'}
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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
		
		if( req.params.beneficiaryID !== "overview") {
			req.session.beneficiary = new ObjectID(req.params.beneficiaryID);
		}
		if(!req.session.beneficiary) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		}

		var data = {
			admin: ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/beneficiary/overview' }
		};
		
		var promisesArray = [
			"role",
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"disability",
			"diagnosis",
			"destination",
			"communication",
			"profession",
			"perimeter",
			"job"
		].map( promiseListArray);

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return RSVP.all(promisesArray);
			})
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
				moment.locale(req.cookies.lang=="en"?"en-gb":req.cookies.lang);
				data.beneficiary = beneficiary;
				data.beneficiary.birthdate = moment(data.beneficiary.birthdate).format("L")
				return beneficiary._id ? beneficiary.getProfessionals() : null;
			}).then(function(professionals){
				if( professionals ){
					data.beneficiary.professionals = professionals;
				}
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
		var admin = ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false;
		var data = {
			admin: admin,
			rights: { read: admin, write:admin, url:"/settings/lists" }
		};

		var promises = [
			"communication",
			"units",
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
		var admin = ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false;
		var data = {
			admin: admin,
			rights: { read: admin, write:admin, url:"/settings/lists" }
		};

		var promises = [
			"communication",
			"units",
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
						// logger.debug("DATA", data);

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
		var admin = ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false;
		var data = {
			admin: admin,
			rights: { read: admin, write:admin, url:"/questionnaires" }
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
		var admin = ["coordinator", "administrator"].indexOf(req.session.role) !== -1 ? true : false;
		var data = {
			admin: admin,
			rights: { read: admin, write:admin, url:"/questionnaires/create" }
		};

		var promises = [
			"communication"
		].map(promiseList);

		RSVP.all(promises)
			.then(function(lists) {
				lists.forEach(function (list) {
					data[Object.keys(list)] = list[Object.keys(list)];
				});
				return physioDOM.Questionnaires();
			})
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
		
		var referer = URL.parse(req.headers.referer).pathname;
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read: false, write:false, url:referer }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				data.rights.read = data.rights.write;
				// logger.debug("rights", data.rights );
				return physioDOM.Questionnaires();
			})
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
		var referer = URL.parse(req.headers.referer).pathnme;
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read: false, write:false, url:referer }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.QuestionnaireAnswer();
			})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/datarecord' }
		};
		
		if( !req.session.beneficiary ) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					data.rights = _rights;
					return physioDOM.Beneficiaries();
				})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/datarecord' }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/datarecord/create' }
		};

		if( !req.session.beneficiary ) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					// logger.debug("rights", _rights );
					data.rights = _rights;
					return physioDOM.Beneficiaries();
				})
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					var jobFilter = ['physician', 'medical'];
					return beneficiary.getProfessionals(jobFilter);
				})
				.then(function(professionals) {
					console.log(professionals);
					data.professionals = professionals;
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

	this.dataRecordSynthesis = function(req, res, next) {
		logger.trace("dataRecordSynthesis");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/datarecord/synthesis' }
		};

		if( !req.session.beneficiary ) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					data.rights = _rights;
					return physioDOM.Beneficiaries();
				})
				.then(function (beneficiaries) {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;

					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/dataRecordSynthesis.htm', data, function (err, output) {
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/message' }
		};

		if( !req.session.beneficiary ) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					data.rights = _rights;
					return physioDOM.Beneficiaries();
				})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/message' }
		};

		if( !req.session.beneficiary ) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {

			var promises = {
				beneficiaries: physioDOM.Beneficiaries(),
				session: req.session.getPerson()
			};

			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					data.rights = _rights;
					data.rights.read = data.rights.write;
					return RSVP.hash(promises);
				})
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
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/healthServices' }
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/physiological-data' }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/healthServices' }
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
		console.log( req.url )
		var data = {
			admin: ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false,
			rights: { read:false, write:false, url: req.url }
		};

		if (!req.session.beneficiary) {
			// logger.debug("No beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		}
		else {
			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					data.rights = _rights;
					return physioDOM.Beneficiaries();
				})
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				return new CurrentStatus().get(beneficiary._id, name);
			})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
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

	function _getSubMenuRights(menus, parentId) {
		logger.trace('_getSubMenu', parentId);

		var subMenu = [];
		var menu;
		for (var i = 0; i < menus.length; i++) {
			if ( parentId ) {
				if( menus[i].parent.toString() === parentId.toString() ) {
					menu = menus[i];
					menu.items = _getSubMenuRights(menus, menus[i]._id);
					subMenu.push(menu);
				}
			} else {
				menu = menus[i];
				subMenu.push(menu);
			}
		}
		// logger.debug('_getSubMenu', parentId);
		return subMenu;
	}

	this.rights = function(req, res, next) {
		logger.trace('page');

		var html;
		init(req);
		var admin = ['coordinator', 'administrator'].indexOf(req.session.role) !== -1 ? true : false;
		var data = {
			admin: admin,
			rights: { read:admin, write:admin }
		};

		physioDOM.Lists.getList('role')
		.then(function(list) {
				data.roles = list.items;
				return new Menu().getAll();
			})
		.then( function(menu) {
				data.items = menu;
				render('/static/tpl/rights.htm', data, res, next);
			})
		.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};

	/**
	 * Agenda
	 */
	
	this.agenda = function(req, res, next) {
		logger.trace("agenda");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false, url: '/agenda' }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/agenda.htm', data, function(err, output) {
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
	 * Dietary & Physical Plan
	 * @param  req
	 * @param  res
	 * @param  next
	 */
	
	this.dietaryPlan = function(req, res, next) {
		logger.trace("dietaryPlan");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false }
		};
		new Menu().rights( req.session.role, '/dietary-plan')
			.then( function( _rights ) { 
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/dietaryPlan.htm', data, function(err, output) {
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

	this.physicalPlan = function(req, res, next) {
		logger.trace("physicalPlan");
		var html;

		init(req);
		var data = {
			admin: ["coordinator","administrator"].indexOf(req.session.role) !== -1?true:false,
			rights: { read:false, write:false }
		};

		new Menu().rights( req.session.role, '/physical-plan')
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary );
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;

				html = swig.renderFile(DOCUMENTROOT+'/static/tpl/physicalPlan.htm', data, function(err, output) {
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
