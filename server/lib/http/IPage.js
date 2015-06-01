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
	SpecialRights = require('../class/specialRights'),
	URL = require("url"),
	ObjectID = require("mongodb").ObjectID;

var CurrentStatus = require('../class/currentStatus.js');
var Menu = require('../class/menu.js');
// var DOCUMENTROOT= "/home/http/physiodom";
var DOCUMENTROOT=require("path").join(__dirname,"../../../");

var logger = new Logger("IPage");
var i18n;

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
		i18n = new(require('i18n-2'))({
			// setup some locales - other locales default to the first locale
			devMode: physioDOM.config.cache?false:true,
			// locales: ["en", "es", "nl", "fr"],
			locales: physioDOM.config.languages,
			extension:".json"
		});
		
		if(req.session) {
			lang = req.session.lang || req.cookies.lang || req.params.lang || physioDOM.lang;
		} else {
			lang = physioDOM.lang;
		}
		logger.info("lang", lang);
		
		i18n.setLocale(lang);
		moment.locale(req.cookies.lang=="en"?"en-gb":req.cookies.lang);
		
		// swig.setDefaults( {cache: physioDOM.config.cache?'memory':false} );
		swig.setDefaults( { cache: false } );
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
		return strDate ? moment(strDate, "YYYY-MM-DD").format(moment.localeData(lang==="en"?"en-gb":lang).longDateFormat("L")) : strDate;
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

	function noaccess( res, next) {
		logger.trace("no access");
		
		swig.renderFile(DOCUMENTROOT + '/static/tpl/noaccess.htm', null, function (err, output) {
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
	
	this.login = function( req, res, next ) {
		logger.trace("login page");
		
		init(req);
		
		var pkg = require("../../../package.json");
		var data = {
			version: pkg.version,
			lang: physioDOM.config.Lang,
			queue: physioDOM.config.queue
		};
		render('/static/index.htm', data, res, next);
	};

	this.password = function( req, res, next ) {
		logger.trace("change password page");

		init(req);

		var pkg = require("../../../package.json");
		var data = {
			version: pkg.version,
			lang: physioDOM.config.Lang,
			idsUser: req.headers["ids-user"] || ""
		};
		render('/static/password.htm', data, res, next);
	};
	
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
					admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
					roleClass: req.session.roleClass,
					idsUser: req.headers["ids-user"] || "",
					items: menu
				};

				req.session.getPerson()
					.then(function(session) {
						// logger.debug("person", session.person);
						data.account = {
								firstname: session.person.item.name.given?session.person.item.name.given.slice(0, 1).toUpperCase():"",
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/directory' }
		};

		var promises = [
			"perimeter",
			"job",
			"role",
			"organizationType",
			"civility"
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
				if( data.rights.read === false ) {
					noaccess( res, next);
				} else {
					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/directory.htm', data, function (err, output) {
						if (err) {
							console.log("error", err);
							console.log(err.stack);
							console.log("output", output);
							res.write(err);
							res.end();
							next();
						} else {
							sendPage(output, res, next);
						}
					});
				}
			})
			.catch(function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next(false);
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/directory' },
			country: physioDOM.config.country,
			lang: physioDOM.lang
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
				data.IDS = physioDOM.config.IDS && req.headers["ids-user"];
				return RSVP.all(promises);
			})
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
				if (professional) {
					data.professional = professional;
				}
				data.sessionID = req.session.person.id;
				if( data.rights.read === false ) {
					noacess( res, next);
				} else {
					html = swig.renderFile(DOCUMENTROOT + '/static/tpl/directoryUpdate.htm', data, function (err, output) {
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
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
				data.IDS = physioDOM.config.IDS && req.headers["ids-user"];
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
				if( data.rights.read === false ) {
					noacess( res, next);
				} else {
					render('/static/tpl/beneficiaryCreate.htm', data, res, next);
				}
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/beneficiary/overview' },
			country : physioDOM.config.country
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
			"generalStatus",
			"exitStatus"
		].map( promiseList);

		var promisesArray = [
			"system",
			"job"
		].map( promiseListArray);

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				data.IDS = physioDOM.config.IDS && req.headers["ids-user"];
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
				if( beneficiaryID === req.session.beneficiary) {
					// indicate that we are editing the selected beneficiary
					data.sessionBene = true;
				} else {
					data.sessionBene = false;
				}
				return beneficiaries.getBeneficiaryAdminByID( req.session, beneficiaryID );
			})
			.then( function(beneficiary) {
				// logger.debug("data", data);
				if(beneficiary){
					data.beneficiary = beneficiary;
					if(data.beneficiary.address) {
						data.beneficiary.address.forEach( function(address, indx){
							if(address.line && address.line.length > 0){
								//To display with line break in the textarea
								address.line = address.line.join("\n");
							} else {
								data.beneficiary.address.splice(indx,1);
							}
						});
					}
					if(data.beneficiary.telecom) {
						data.beneficiary.telecom.forEach( function(telecom, indx) {
							if(! telecom.value ) {
								data.beneficiary.telecom.splice(indx,1);
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
				// console.log( "-> test" );
				if( professionals ){
					data.beneficiary.professionals = professionals;
				}
				// console.log( "rights", data.rights );
				if( data.rights.read === false ) {
					noaccess( res, next);
				} else {
					render('/static/tpl/beneficiaryCreate.htm', data, res, next);
				}
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
		var that = this;
		
		console.log( req.session.roleClass );
		if( req.session.role === "beneficiary" ) {
			logger.warning("beneficiary connected redirect to overview");
			res.header('Location', '/beneficiary/'+req.session.beneficiary.toString());
			res.send(302);
			return next();
		}
		init(req);
		var data = {
			admin: ["COORD", "ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
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
					console.log("no benefeciary selected");
					// throw( { code:404, message:"no beneficiary selected"});
					return null;
				}
			})
			.then(function (beneficiary) {
				data.beneficiary = beneficiary;
				var professional = req.session.person.item;
				data.hasBeneficiary = (professional.nb !== 0 || ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1);

				console.log("get beneficiaries page");
				physioDOM.Lists.getList("perimeter", lang)
					.then(function (list) {
						if (list) {
							data.perimeter = list;
						}
						render('/static/tpl/beneficiaries.htm', data, res, next);
					})
					.catch(function (err) {
						logger.error(err);
						res.write(err);
						res.end();
						next();
					});
			})
			.catch( function(err) {
				console.log("en error suddendly appears",err);
				html = swig.renderFile(DOCUMENTROOT + '/static/tpl/noaccess.htm', null, function (err, output) {
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
			admin  : ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights : { read:false, write:false, url: '/beneficiary/overview' },
			queue  : physioDOM.config.queue ?true:false,
			IDS    : physioDOM.config.IDS && req.headers["ids-user"]
		};
		
		var promisesArray = [
			"role",
			"civility",
			"system",
			"use",
			"wayOfLife",
			"maritalStatus",
			"disability",
			"diagnosis",
			"destination",
			"communication",
			"perimeter",
			"nutritionalStatus",
			"generalStatus",
			"job",
			"exitStatus"
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
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then( function( beneficiary ) {
				moment.locale(req.cookies.lang==="en"?"en-gb":req.cookies.lang);
				data.beneficiary = beneficiary;
				data.beneficiary.address.forEach( function(address) {
					address.use = data.useArray.items[address.use];
				});
				data.beneficiary.gender = data.civilityArray.items[data.beneficiary.gender];
				data.beneficiary.birthdate = moment(data.beneficiary.birthdate).format("L");
				return beneficiary._id ? beneficiary.getProfessionals() : null;
			}).then(function(professionals){
				if( professionals ){
					professionals.forEach( function(professional) {
						professional.job = data.jobArray.items[professional.job];
					});
					data.beneficiary.professionals = professionals;
				}
				render('/static/tpl/beneficiaryOverview.htm', data, res, next);
			})
			.catch( function(err) {
				logger.error(err);
				req.session.beneficiary = null;
				req.session.save()
					.then( function() {
						res.header('Location', '/beneficiaries');
						res.send(302);
						res.end();
						next();
					});
			});
	};

	/**
	 * Get The IDS log page for the current beneficiary
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.IDSLog = function(req, res, next) {
		logger.trace("GetLogLines");
		var html, beneficiary;
		init(req);
		
		moment.locale( physioDOM.lang === "en"?"en-gb":physioDOM.lang );
		var maxDate = moment();
		if( req.params.maxDate && moment(req.params.maxDate).isValid()) {
			maxDate = moment(req.params.maxDate).hours(23).minutes(59).seconds(59);
		}
		var IDSLog = require("./ILogIDS");
		
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights: { read:true, write:false, url: '/beneficiary/overview' },
			prevMonth: moment(maxDate).date(1).subtract(1,"d").format("YYYY-MM-DD"),
			nextMonth: moment(maxDate).add(1,"M").format("YYYY-MM-DD")
		};
		
		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return IDSLog.getLogLines( req, res, maxDate );
			})
			.then( function( logLines ) {
				data.logLines = logLines.logLines.logLine;

				render('/static/tpl/idslog.htm', data, res, next);
			})
			.catch( function(err) {
				logger.error("--> ", err);
				console.log(err);
				res.end(500, err);
				next(false);
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
		var admin = ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false;
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
						render('/static/tpl/lists.htm', data, res, next);
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
		var admin = ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false;
		var data = {
			admin: admin,
			roleClass: req.session.roleClass,
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
						render('/static/tpl/list.htm', data, res, next);
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
	 * Questionnaires pages ( admin / coordinator only eyes )
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.questionnaires = function(req, res, next) {
		logger.trace("questionnaires");
		var html;

		init(req);
		var admin = ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false;
		var data = {
			admin: admin,
			roleClass: req.session.roleClass,
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
				render('/static/tpl/questionnaireSelection.htm' , data, res, next);
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

		init(req);
		var admin = ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1 ? true : false;
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
				render('/static/tpl/questionnaireCreation.htm' , data, res, next);
			})
			.catch( function(err) {
				logger.error(err);
				console.log( err.stack );
				res.write(err);
				res.end();
				next();
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
			admin: ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false,
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
				render('/static/tpl/questionnaireOverview.htm' , data, res, next);
			})
			.catch( function(err) {
				logger.error(err);
				res.write(err);
				res.end();
				next();
			});
	};


	/**
	 * Questionnaire Preview
	 * 
	 * The questionnaire preview is shown only to admin and coordinators when editing a questionnaire
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	this.questionnairePreview = function(req, res, next) {
		logger.trace("questionnairePreview");
		var html;

		init(req);

		var referer = URL.parse(req.headers.referer).pathname;
		var admin = ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false;
		var data = {
			admin: admin,
			rights: { read: admin, write:admin, url:referer },
			preview: true
		};

		physioDOM.Questionnaires()
			.then(function(questionnaires){
				return questionnaires.getQuestionnaireByName(req.params.questionnaireName);
			})
			.then( function(questionnaire) {
				data.questionnaire = questionnaire;
				data.lang = lang;
				//logger.debug("DATA", data);
				render('/static/tpl/questionnaireOverview.htm' , data, res, next);
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
			admin: ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false,
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
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
					if( req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary._id ? beneficiary.getProfessionals() : null;
				}).then(function (professionals) {
					if (professionals) {
						data.professionals = professionals;
					}
					render('/static/tpl/dataRecord.htm' , data, res, next);
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

		init(req);
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: '/datarecord' }
		};
		
		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				return beneficiary.getCompleteDataRecordByID(req.params.dataRecordID);
			})
			.then(function(record) {
				data.dataRecordItems = record;
				data.view = 'update';

				render('/static/tpl/dataRecordEdit.htm' , data, res, next);
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

		init(req);
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: '/datarecord/create' },
			role: req.session.role
		};
		
		if( !req.session.beneficiary ) {
			// logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		} else {
			console.log( req.session.role );
			new Menu().rights( req.session.role, data.rights.url )
				.then( function( _rights ) {
					console.log( _rights );
					// logger.debug("rights", _rights );
					data.rights = _rights;
					return physioDOM.Beneficiaries();
				})
				.then(function (beneficiaries) {
					if( req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary.getProfessionalsRoleClass("HEALTH");
				})
				.then(function(professionals) {
					data.professionals = professionals;
					data.view = 'create';
					data.lang = lang;
					data.source = {
						name : req.session.person.item.name,
						_id : req.session.person.id
					};

					render('/static/tpl/dataRecordEdit.htm' , data, res, next);

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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
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
					if( req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;

					render('/static/tpl/dataRecordSynthesis.htm' , data, res, next);
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1? true : false ,
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
					data.lang = lang;
					return physioDOM.Beneficiaries();
				})
				.then(function (beneficiaries) {
					if( req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary._id ? beneficiary.getProfessionals() : null;
				})
				.then(function (professionalList) {
					if (professionalList) {
						data.professionalList = professionalList;
					}

					render('/static/tpl/messageList.htm' , data, res, next);

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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
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
					if( req.session.role === "beneficiary") {
						return result.beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return result.beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then(function (beneficiary) {
					data.beneficiary = beneficiary;
					return beneficiary._id ? beneficiary.getProfessionals() : null;
				}).then(function (professionalList) {
					if (professionalList) {
						data.professionalList = professionalList;
					}
					data.lang = lang;

					render('/static/tpl/messageCreate.htm' , data, res, next);

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
			admin: ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/healthServices' }
		};

		render('/static/tpl/healthServices.htm' , data, res, next);
	};


	this.physiologicalData = function(req, res, next) {
		logger.trace("PhysiologicalData");
		var html;

		init(req);
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: '/physiological-data' }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;

				render('/static/tpl/physiologicalData.htm' , data, res, next);

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
			admin: ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false,
			rights: { read:false, write:false, url: '/healthServices' }
		};

		render('/static/tpl/healthServiceCreate.htm' , data, res, next);
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
			admin: ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false,
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
					return new SpecialRights().rights( req.session.role, "Validate" );
				}).then( function(_rights) {
					data.validate = _rights;
					return physioDOM.Beneficiaries();
				})
				.then(function(beneficiaries) {
					if( req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
					}
				})
				.then(function(beneficiary) {
					data.beneficiary = beneficiary;
					return new CurrentStatus().get(beneficiary._id, name);
				})
				.then(function(status) {
					data.status = status;
					return physioDOM.Directory();
				})
				.then( function(directory) {
					if(data.status.validated.author) {
						return directory.getEntryByID(data.status.validated.author.toString());
					} else {
						return null;
					}
				})
				.then(function(author) {
					if(author !== null) {
						data.author = author;
					}
					return physioDOM.Lists.getList('parameters');
				})
				.then(function(parameters) {
					if( data.status.questionnaires ) {
						Object.keys(data.status.questionnaires).forEach(function (questionnaire) {
							if (data.status.questionnaires[questionnaire].date) {
								data.status.questionnaires[questionnaire].dateFormat = moment(data.status.questionnaires[questionnaire].date).toISOString();
							}
						});
					}
	
					render('/static/tpl/current/' + name + '.htm', data, res, next);
				})
				.catch(function(err) {
					if (err.code && err.code === 404) {
						data.status = {};
						render('/static/tpl/current/' + name + '.htm', data, res, next);
					}
					else {
						logger.error(err);
						logger.error(err.stack);
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.category = 'General';
				data.parameterList = 'parameters';
				// jsut for test, otherwise read locale from session

				render('/static/tpl/prescriptionData.htm' , data, res, next);

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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.category = 'HDIM';
				data.parameterList = 'parameters';
				// jsut for test, otherwise read locale from session

				render('/static/tpl/prescriptionData.htm' , data, res, next);

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

		init(req);
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.category = '';
				data.parameterList = 'symptom';

				render('/static/tpl/prescriptionData.htm' , data, res, next);

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

		init(req);
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: req.url }
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				data.lang = lang;
				data.title = 'Questionnaires';

				render('/static/tpl/prescriptionQuestionnaire.htm' , data, res, next);

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
		
		init(req);
		var admin = ['COORD', 'ADMIN'].indexOf(req.session.roleClass) !== -1 ? true : false;
		var data = {
			admin: admin,
			roleClass : req.session.roleClass,
			rights: { read:admin, write:admin },
			lang: req.cookies.lang || req.session.lang || physioDOM.lang
		};
		
		physioDOM.Lists.getList('role')
			.then(function(list) {
				data.roles = [];
				list.items.forEach( function(item) {
					if( item.active ) {
						data.roles.push( item );
					}
				});
				console.log( data.roles );
				return new Menu().getAll();
			})
			.then( function(menu) {
				data.items = menu;
				// console.log( "menu", menu );
				return new SpecialRights().getAll();
			})
			.then( function( rights ) {
				data.spItems = rights;
				render('/static/tpl/rights.htm', data, res, next);
			})
			.catch(function(err) {
				console.log( err.stack );
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

		init(req);
		var data = {
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false, url: '/agenda' },
			lang : lang
		};

		new Menu().rights( req.session.role, data.rights.url )
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;

				render('/static/tpl/agenda.htm' , data, res, next);

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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false }
		};
		new Menu().rights( req.session.role, '/dietary-plan')
			.then( function( _rights ) { 
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;
				render('/static/tpl/dietaryPlan.htm' , data, res, next);
			})
			.catch(function(err) {
				console.log( err.stack );
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
			admin: ["COORD","ADMIN"].indexOf(req.session.roleClass) !== -1?true:false,
			rights: { read:false, write:false }
		};

		new Menu().rights( req.session.role, '/physical-plan')
			.then( function( _rights ) {
				data.rights = _rights;
				return physioDOM.Beneficiaries();
			})
			.then(function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function(beneficiary) {
				data.beneficiary = beneficiary;

				render('/static/tpl/physicalPlan.htm' , data, res, next);

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
		if( ["/static/index.htm","/static/password.htm"].indexOf(tpl) === -1 && (!data.rights || data.rights.read === false) ) {
			noaccess( res, next );
		} else {
			swig.renderFile(DOCUMENTROOT + tpl, data, function (err, output) {
				if (err) {
					console.log('error', err);
					console.log( err.stack );
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
		next(false);
	}
}

module.exports = new IPage();
