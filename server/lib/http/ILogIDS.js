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
					return next(false);
				} else {
					logger.debug(result);
					logger.info("Unit created", physioDOM.config.IDS.unit );
					if( next ) { next(); }
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
	}
}

module.exports = ILogIDS;