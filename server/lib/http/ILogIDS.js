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

"use strict";

var soap = require('soap'),
    Logger = require("logger"),
    promise = require("rsvp").Promise,
    moment = require("moment"),
    Cookies = require("cookies");

var logger = new Logger("ILogIDS");

var ILogIDS = {
	LogAccess: function (req, res, patientID, msg, cb) {
		logger.trace("logAccess", patientID, msg);
		
		var wsdl = 'http://api.idshost.priv/log.wsdl';
		
		var cookies = new Cookies(req, res);
		
		var methods =  { GET:0, POST:1, PUT:2, DELETE:3 };
		
		var LogAccess = {
			logline : {
				LogDate           : "",
				Application       : physioDOM.config.IDS.appName,
				Requester         : req.headers["ids-user"],
				OrganizationUnit  : req.headers["ids-ou"],
				AuthCookie        : cookies.get("sessionids"),
				PageName          : req.route.path,
				Unit              : physioDOM.config.IDS.unit,
				Patient           : patientID,
				AccessType        : methods[req.method],
				Extra             : msg
			}
		};
		
		soap.createClient(wsdl, function (err, client) {
			if(err) {
				logger.alert(err);
				return cb();
			}
			
			client.LogAccess(LogAccess, function (err, result ) {
				if(err) {
					logger.error(err.root.Envelope.Body.Fault );
				} else {
					logger.info(result);
				}
				if (cb) { cb(); }
			});
		});
		
	},
	
	createUnit: function (req, res, next) {
		logger.trace("createUnit");
		
		var wsdl = 'http://api.idshost.priv/unit.wsdl';
		
		var cookies = new Cookies(req, res);
		
		
		var CreateUnit = {
			manageUnitRequest : {
				Application       : physioDOM.config.IDS.appName,
				Requester         : req.headers["ids-user"],
				AuthCookie        : cookies.get("sessionids"),
				UnitName          : physioDOM.config.IDS.unit,
				Comment           : "Creation de l'unite : "+physioDOM.config.IDS.unit
			}
		};
		
		soap.createClient(wsdl, function (err, client) {
			if(err) {
				logger.alert(err);
				res.send(400, { code:400, message:err });
				return next(false);
			}
			
			client.CreateUnit(CreateUnit, function (err, result ) {
				if(err) {
					logger.warning(err.root.Envelope.Body.Fault);
					res.send(400, { code:400, message:[ CreateUnit, err.root.Envelope.Body.Fault ] });
					next(false);
				} else {
					logger.debug(result);
					logger.info("Unit created", physioDOM.config.IDS.unit );
					res.send(200, { code:200, message:"Unit created" + physioDOM.config.IDS.unit });
					if( next ) { next( false); }
				}
			});
		});
	},
	
	getLogLines: function (req, res, maxDate, minDate ) {
		
		return new promise( function( resolv, reject) {
			logger.trace("getLogLines");
		
			var wsdl = 'http://api.idshost.priv/log.wsdl';
			var cookies = new Cookies(req, res);
			
			moment.locale( physioDOM.lang === "en"?"en-gb":physioDOM.lang );
			if( !maxDate ) {
				maxDate = moment();
			}
			console.log( maxDate.toISOString() );
			
			if( !minDate ) {
				minDate = moment(maxDate).date(1);
				minDate.hours(0).minutes(0).second(0);
			}
			
			var getLogLineRequest = {
				getloglinesrequest : {
					Application             : physioDOM.config.IDS.appName,
					Requester               : req.headers["ids-user"],
					AuthCookie              : cookies.get("sessionids"),
					ReqFilter               : "*",
					OrganizationUnitFilter  : "*",
					UnitFilter              : physioDOM.config.IDS.unit,
					PatientFilter           : req.session.beneficiary.toString(),
					MinTimeFilter           : minDate.toISOString(),
					MaxTimeFilter           : maxDate.toISOString(),
					ExtraFilter             : "*"
				}
			};
			
			// logger.debug( getLogLineRequest );
			/*
			resolv( getLogLineRequest );
			*/
			
			soap.createClient(wsdl, function (err, client) {
				if(err) {
					logger.alert(err);
					reject( err );
				}
			
				client.GetLogLines(getLogLineRequest, function ( err, result ) {
					if(err) {
						logger.warning(err.root.Envelope.Body.Fault);
						reject( err.root.Envelope.Body.Fault );
					} else {
						resolv( result );
					}
				});
			});
			
		});
	},
	
	logging: function( req, res ) {
		var patientID, msg;
		switch (req.route.path) {
			case '/api/beneficiaries' :
				switch (req.method) {
					case "POST":
						patientID = "";
						msg = "create a new beneficiary";
						break;
				}
				break;
			case '/api/beneficiary' :
			case '/api/beneficiaries/:entryID':
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "consult the beneficiary overview";
						break;
					case "PUT":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "modify the beneficiary overview";
						break;
					case "DELETE":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "delete the beneficiary";
						break;
				}
				break;
			case '/api/beneficiary/professionals':
			case '/api/beneficiaries/:entryID/professionals' :
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "get list of professionals attached to the beneficiary";
						break;
					case "POST":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "update list of professionals attached to the beneficiary";
						break;
				}
				break;
			case '/api/beneficiaries/:entryID/professionals/:profID' :
				switch (req.method) {
					case "DELETE":
						patientID = req.params.entryID;
						msg = "remove a professional attached to the beneficiary";
						break;
				}
				break;
			case '/api/beneficiary/graph':
			case '/api/beneficiaries/:entryID/graph':
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "get list of parameters for graph";
						break;
				}
				break;
			case '/api/beneficiary/graph/:category/:paramName' :
			case '/api/beneficiaries/:entryID/graph/:category/:paramName' :
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "get measures for the parameters " + req.params.paramName + " for graph";
						break;
				}
				break;
			case '/api/beneficiary/history':
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "get the synthesys table for all measured parameters";
						break;
				}
				break;
			case '/api/beneficiary/datarecords':
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "get list of data records";
						break;
				}
				break;
			case '/api/beneficiary/datarecords/:dataRecordID' :
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "get a the datarecord " + req.params.dataRecordID;
						break;
					case "PUT":
						patientID = req.session.beneficiary;
						msg = "modify the datarecord " + req.params.dataRecordID;
				}
				break;
			case '/api/beneficiary/datarecord' :
				switch (req.method) {
					case "POST":
						patientID = req.session.beneficiary;
						msg = "create a new the datarecord ";
						break;
				}
				break;
			case '/api/beneficiary/thresholds' :
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "get the thresholds list ";
						break;
					case "POST":
						patientID = req.session.beneficiary;
						msg = "update the thresholds list ";
						break;
				}
				break;
			case '/api/beneficiary/messages' :
			case '/api/beneficiaries/:entryID/messages' :
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "Get list of messages";
						break;
					case "POST":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "Create a new message";
						break;
				}
				break;
			case '/api/beneficiary/dataprog':
			case '/api/beneficiaries/:entryID/dataprog' :
				switch (req.method) {
					case "POST":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "create a data monitoring prescription";
						break;
				}
				break;
			case '/api/beneficiary/dataprog/:category' :
			case '/api/beneficiaries/:entryID/dataprog/:category' :
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "Get list of data monitoring prescription ( category :" + req.params.category + " )";
						break;
				}
				break;
			case '/api/beneficiary/dataprog/:dataProgItemID' :
			case '/api/beneficiaries/:entryID/dataprog/:dataProgItemID' :
				switch (req.method) {
					case "DELETE":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "remove a data monitoring prescription";
						break;
				}
				break;
			case '/api/beneficiary/current/:name' :
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "get the initial health status (" + req.params.name + ")";
						break;
					case "PUT":
						patientID = req.session.beneficiary;
						msg = "create the initial health status (" + req.params.name + ")";
						break;
				}
				break;
			case '/api/beneficiary/questionnaires/:entryID/answers' :
				switch (req.method) {
					case "POST":
						patientID = req.session.beneficiary;
						msg = "answer of the questionnaire (" + req.params.entryID + ")";
						break;
				}
				break;
			case '/api/beneficiary/events' :
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "Get list of events";
						break;
				}
				break;
			case '/api/beneficiary/dietary-plan' :
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "view the current dietary plan advice";
						break;
					case "POST":
						patientID = req.session.beneficiary;
						msg = "update the dietary plan advice";
						break;
				}
				break;
			case '/api/beneficiary/dietary-plans' :
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "view the history of dietary plan advices";
						break;
				}
				break;
			case '/api/beneficiary/physical-plan':
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "view the current physical plan advice";
						break;
					case "POST":
						patientID = req.session.beneficiary;
						msg = "update the physical plan advice";
						break;
				}
				break;
			case '/api/beneficiary/physical-plans':
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "view the history of physical plan advices";
						break;
				}
				break;
			case '/api/beneficiary/questprog' :
			case '/api/beneficiaries/:entryID/questprog' :
				switch (req.method) {
					case "GET":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "view the questionnaires prescriptions";
						break;
					case "PUT":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "update questionnaires prescriptions";
						break;
				}
				break;
			case '/api/beneficiary/questprog/:ref' :
			case '/api/beneficiaries/:entryID/questprog/:ref':
				switch (req.method) {
					case "POST":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "create a questionnaire prescription";
						break;
					case "DELETE":
						patientID = req.params.entryID || req.session.beneficiary;
						msg = "remove a questionnaire prescription";
						break;
				}
				break;
			case '/beneficiary/:beneficiaryID':
				switch (req.method) {
					case "GET":
						patientID = req.params.beneficiaryID;
						msg = "consult the beneficiary overview";
						break;
				}
				break;
			case '/beneficiary/edit/:beneficiaryID' :
				switch (req.method) {
					case "GET":
						patientID = req.params.beneficiaryID;
						msg = "open the beneficiary overview for editing";
						break;
				}
				break;
			case '/answers/:entryID':
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "consult answer of questionnaire";
						break;
				}
				break;
			case '/datarecord/:dataRecordID':
				switch (req.method) {
					case "GET":
						patientID = req.session.beneficiary;
						msg = "consult detail of a datarecord";
						break;
				}
				break;
		}
		if( patientID && msg ) {
			this.LogAccess(req, res, patientID.toString(), msg);
		}
	}
}

module.exports = ILogIDS;