/* jslint node:true */

"use strict";
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

/* global -Promise */

var restify = require("restify"),
	fs      = require('fs'),
	program = require("commander"),
	path    = require("path"),
	Cookies = require("cookies"),
	Logger  = require("logger"),
	I18n    = require("i18n-2"),
	Agenda = require("agenda"),
	moment = require("moment"),
	RSVP = require("rsvp"),
	Promise = require("rsvp").Promise,
	PhysioDOM = require("./lib/class/physiodom"),
  fork = require('child_process').fork;

var IDirectory = require('./lib/http/IDirectory'),
	ICSV = require('./lib/http/ICSV'),
	IBeneficiary = require('./lib/http/IBeneficiary'),
	ILists = require("./lib/http/ILists"),
	IPage = require("./lib/http/IPage"),
	IQuestionnaire = require("./lib/http/IQuestionnaire"),
	ICurrentStatus = require('./lib/http/ICurrentStatus'),
	IMenu = require("./lib/http/IMenu"),
	IQueue = require("./lib/http/IQueue"),
	ILogIDS = require("./lib/http/ILogIDS.js"),
	IServices = require("./lib/http/IServices"),
	ISocialReport = require("./lib/http/ISocialReport"),
	ISpecificData = require("./lib/http/ISpecificData"),
	configSchema = require("./lib/schema/configSchema.js");

var pkg     = require('../package.json');
var logger = new Logger( "PhysioDOM App");
var DOCUMENT_ROOT = __dirname+"/../static";

var config =  { cache : true };

var cookieOptions = {
	path: '/',
	httpOnly : true
};

program
	.version(pkg.version)
	.usage('[options] [dir]')
	.option('-p, --port <port>', 'specify the port [8001]', Number, 8001)
	.option('-c, --config <config>', 'configuration file', String )
	.parse(process.argv);

if( program.config ) {
	if( !program.config.match(/^\//) ) {
		program.config = path.join(__dirname+'/..',program.config );
	}
	var tmp = require(program.config);
	var check = configSchema.validator.validate( tmp, { "$ref":"/Config"} );
	if( check.errors.length ) {
		for( var i= 0, l=check.errors.length; i<l; i++) {
			logger.error( "config "+ check.errors[i].stack );
		}
		process.exit(1);
	} else {
		config.port = program.port || tmp.port;
		config.Lang = tmp.Lang;
		config.mongouri = "mongodb://"+tmp.mongo.ip+"/"+tmp.mongo.db;
		config.key = tmp.key;
		config.cache = tmp.cache;
		config.languages = tmp.languages;
		config.server = tmp.server;
		config.agenda = tmp.agenda;
    config.agendaForce = tmp.agendaForce;
		config.healthStatusValidation = tmp.healthStatusValidation;
		config.country = tmp.country || '';
		config.timezone = tmp.timezone || 'Europe/Paris';
		
		if( tmp.queue ) {
			config.queue = tmp.queue.protocol+"://"+tmp.queue.ip+":"+tmp.queue.port;
			config.duration = tmp.queue.duration;
		}
		if( tmp.IDS ) {
			config.IDS = tmp.IDS;
		}
		
		if( tmp.smtp) {
			config.smtp = tmp.smtp;
		}
		
		if( tmp.mailTpl ) {
			config.mailTpl = tmp.mailTpl;
		}
	}
} else {
	logger.error("you must provide a config file");
	process.exit(1);
}


/**
 * requestLog
 * show request information
 * @param req
 * @param res
 */
/*
function requestLog(req, res) {
	var ipAddress = req.headers['x-forwarded-for'] === undefined ? req.connection.remoteAddress : req.headers['x-forwarded-for'];
	logger.info(ipAddress, req.method, req.url);
	logger.debug(" ", "cookies : ", req.cookies);
	logger.debug(" ", "params : ", req.params);
	logger.debug(" ", "body : ", req.body ? req.body.toString() : "-");
	return;
}
*/

/**
 * message de log de la réponse
 *
 * @param {Object} req the request object
 * @param {Object} res the response object
 * @return null
 */
function responseLog(req, res) {
	var ipAddress = req.headers['x-forwarded-for'] === undefined ? req.connection.remoteAddress : req.headers['x-forwarded-for'];
	var responseTime = (res._headers && res._headers.hasOwnProperty('response-time') ? res._headers['response-time'] + 'ms' : '');
	logger.info(ipAddress, req.method, req.url, res.statusCode, responseTime);
	return;
}

var physioDOM = new PhysioDOM( config );   // PhysioDOM object is global and so shared to all modules
global.physioDOM = physioDOM;              // set the object global
var agenda = new Agenda({db: { address: config.mongouri }});

logger.trace('server initialization started');
try {
  var QueueWorker = fork(path.join(__dirname,'./agendaQueue.js'));

  QueueWorker.on('message', function (m) {
    switch(m.event) {
      case 'started':
        logger.trace('initialize worker');
        QueueWorker.send( { event: 'config', config: config });
        break;
      case 'ready':
        logger.trace('schedule pushToQueue');
        agenda.purge( function(err, numRemoved) {
          if( config.queue ) {
            // if no queue is defined then no jobs need to be defined
            agenda.define('push plans', function (job, done) {
             logger.trace('do pushToQueue');
             QueueWorker.send({event:'doPush', force: false });
             done();
            });
            agenda.define('force push plans', function(job,done) {
              logger.trace('do pushToQueue force');
              QueueWorker.send({event:'doPush', force: true });
              done();
             });
             agenda.every(config.agenda, 'push plans');
             agenda.every(config.agendaForce, 'force push plans');
          }
        });
        agenda.start();
        // QueueWorker.send({event:'doPush', force: true });
        break;
      case 'error':
        process.exit(1);
        break;
      default:
        console.log('main : get message', m);
    }
  });
} catch(err) {
  console.log(err);
}

var server = restify.createServer({
	name:    pkg.name,
	version: pkg.version
});

I18n.expressBind(server, {
	// setup some locales - other locales default to en silently
	locales: physioDOM.lang,
	// change the cookie name from 'lang' to 'locale'
	cookieName: 'lang'
});

server.pre(function(req, res, next) {
	req.ipAddress = req.headers['x-forwarded-for'] === undefined ? req.connection.remoteAddress : req.headers['x-forwarded-for'];
	return next();
});

server.use( function(req, res, next) {
	req.cookies = {};
	
	function readCookies( cb ) {
		return new Promise( function(resolve,reject) {
			logger.trace("read cookies");
			if( req.headers.cookie ) {
				var cookies = req.headers.cookie.split(';');
				var count = cookies.length;
				cookies.forEach(function (cookie) {
					var parts = cookie.split('=');
					req.cookies[parts[0].trim()] = parts[1].trim() || '';
					if( --count === 0 ) {
						// console.log( req.cookies);
						resolve( req.cookies );
					}
				});
			} else {
				resolve( {} );
			}
		});
	}

	function getSession( cb ) {
		return new Promise( function(resolve,reject) {
			logger.trace("getSessionAccount");
			if (req.cookies && req.cookies.sessionID) {
				physioDOM.getSession(req.cookies.sessionID)
					.then(function (session) {
						session.getPerson()
							.then(function (session) {
								resolve(session);
							})
							.catch(function (err) {
								logger.error("error", JSON.stringify(err, null, 4));
								reject(err);
							});
					})
					.catch(function (err) {
						logger.warning("error", err, cb);
						reject(err);
					});
			} else {
				logger.warning("no session");
				reject();
			}
		});
	}
	
	readCookies()
		.then(function(cookies) {
			getSession()
				.then( function(session) {
					req.session = session;
					logger.debug("session exists");
					return next();
				})
				.catch( function() {
						logger.debug("remove cookie");
						req.session = null;
						cookies = new Cookies(req, res);
						cookies.set('sessionID');
						logger.debug("url", req.url);
						if (req.url.match(/^(\/|\/version|\/api\/login|\/api\/logout|\/api\/checkpasswd|\/logout|\/api\/queue\/(status|received))$/)) {
							return next();
						} else {
							if (req.url.match(/^\/api/)) {
								res.send(403, "no session created");
							} else {
								logger.info("redirect to home page");
								res.header('Location', '/');
								res.send(302);
							}
							return next(false);
						}
				});
			});
});

server.use(restify.gzipResponse());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.pre(restify.pre.userAgentConnection());

server.use(function checkAcl(req, res, next) {
	logger.trace("checkAcl",req.url);

	if( req.url === "/" || req.url.match(/^(\/api|\/logout|\/api\/checkpasswd|\/api\/password|\/directory|\/settings|\/questionnaires|\/admin|\/beneficiaries|\/queue|\/version|\/createunit|\/message\/list)/) ) {
		return next();
	} else {
		if (!req.session.beneficiary && req.url !== "/beneficiaries" &&
			!req.url.match(/^\/beneficiary\/[0-9a-f]+$/) &&
			!req.url.match(/^\/beneficiary\/edit\/[0-9a-f]+$/) ) {
			logger.debug("no beneficiary selected");
			res.header('Location', '/beneficiaries');
			res.send(302);
			return next();
		}
	}
	
	return next();
});

/**
 * checkPasswd
 *
 * this method is called by the SOAPservice
 * Check if a user has an account on this HHR-Pro instance
 * if true send { valid:true } else { valid:false }
 * 
 * @param req    request object
 * @param res    response object
 * @param next   callback
 */
function checkPasswd(req, res, next ) {
	logger.trace("checkPasswd");
	// console.log( req.body );
	var body = req.body?req.body.toString():"";
	if( !body ) {
		res.send(200, { valid: false } );
	} else {
		try {
			var user = JSON.parse(body);
			physioDOM.getAccountByIDSCredentials(user.login, user.password)
				.then(function (account) {
					logger.info("valid user");
					res.send(200, {valid: true});
					return next();
				})
				.catch(function (err) {
					logger.info("not a valid user");
					res.send(200, {valid: false});
				});
		} catch( err ) {
			res.send(200, { valid: false } );
			return next();
		}
	}
}

function apiLogin(req, res, next) {
	logger.trace("apiLogin");
	var body,cookies;

	if( req.headers.authorization ) {
		logger.debug("authorization header");
		var token = req.headers.authorization.split(/\s+/).pop() || '';            // and the encoded auth token
		var auth = new Buffer(token, 'base64').toString();    // convert from base64
		var parts = auth.split(/:/);                          // split on colon
		body = JSON.stringify({login: parts[0], password: parts[1]});
	} else {
		body = req.body?req.body.toString():"";
	}

	cookies = new Cookies(req, res);

	try {
		var user = JSON.parse( body );
		if( !user.login || !user.password ) {
			cookies.set('sessionID');
			cookies.set('role');
			logger.warning("no login or password");
			res.send(403);
			return next(false);
		} else {
			physioDOM.getAccountByCredentials(user.login, user.password )
				.then( function(account) {
					return account.createSession();
				})
				.then( function(session) {
					if( session) {
						cookies.set('sessionID', session.sessionID, cookieOptions);
						cookies.set('role', session.role, {path: '/', httpOnly: false});
						cookies.set('lang', session.lang || physioDOM.lang, {path: '/', httpOnly: false});
						res.send(200, {code: 200, message: "logged"});
						return next();
					} else {
						res.send(405, {code: 405, message: "account not activated"});
						return next();
					}
				})
				.catch( function(err) {
					logger.warning(err.message || "bad login or password");
					cookies.set('sessionID');
					cookies.set('role');
					res.send( 403, {code:403, message:"bad credentials"} );
					next();
				});
		}
	} catch(err) {
		logger.warning("bad json format");
		cookies.set('sessionID');
		cookies.set('role');
		res.send(403, {code:403, message:"bad credentials"});
		return next(false);
	}
}

function apiPassword(req, res, next) {
	logger.trace("apiPassword");
	var cookies;

	cookies = new Cookies(req, res);

	try {
		// console.log( req.body );
		var passwd = JSON.parse(req.body.toString());
		if( !passwd.passwd || !passwd.confirmpasswd ) {
			res.send(400, {code:400, message:"needs two passwords"});
			return next(false);
		}
		if( passwd.passwd !== passwd.confirmpasswd ) {
			res.send(400, {code:400, message:"the two passwords didn't match"});
			return next(false);
		}
		var person = req.session.person.item;
		person.accountUpdatePasswd( passwd.passwd )
			.then( function(account) {
				cookies.set('sessionID');
				cookies.set('role');
				res.send(200, {code:200, message:"password changed"});
				return next(false);
			})
			.catch( function(err) {
				console.log(err);
				res.send(400, {code:400, message:"Error"});
				return next(false);
			});
	} catch(err) {
		console.log(err);
		if(err.stack) {
			console.log(err.stack);
		}
		logger.warning("bad json format");
		cookies.set('sessionID');
		cookies.set('role');
		res.send(403, {code:403, message:"bad credentials"});
		return next(false);
	}
}

server.opts(/\.*/,function (req, res, next) {
	var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version','X-Api-Version', 'X-Request-Id',' X-Response-Time','X-Custom-Header'];
	if (res.methods.indexOf('OPTIONS') === -1) {
		res.methods.push('OPTIONS');
	}
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
	res.header('Access-Control-Allow-Methods', 'OPTIONS,POST,GET,PUT,DELETE');//res.methods.join(', '));
	res.send(200);
	return next();
});

server.on("after",function(req,res) {
	responseLog(req,res);

	if( physioDOM.config.IDS && req.headers["ids-user"] ) {
		ILogIDS.logging(req, res);
	}
});

function logout(req, res, next ) {
	var cookies = new Cookies(req, res);
	logger.trace( "logout" );
	physioDOM.deleteSession( cookies.get("sessionID") )
		.catch( function(err) {
			console.log("Error ",err);
		}).finally( function() {
		logger.info('unset cookies');
		cookies.set('sessionID');
		cookies.set('role');
		cookies.set("lang");
		if(req.url.match(/^\/api/)) {
			// res.send(200);
			res.send(403, { error:403, message:"no session"} );
		} else {
			logger.debug("redirect to /");
			res.header('Location', '/');
			res.send(302);
		}
		return next();
	});
}

function getSessions( req, res, next ) {
	logger.trace("getSessions");
	var pg = parseInt(req.params.pg,10) || 1;
	var offset = parseInt(req.params.offset,10) || 10;
	var sort = req.params.sort;

	physioDOM.getSessions(pg, offset, sort)
		.then(function(list) {
			res.send(list);
			next();
		});
}

var mimetypes = {
	'atom':'application/atom+xml',
	'avi':'video/x-msvideo',
	'css':'text/css',
	'gif':'image/gif',
	'htm':'text/html',
	'html':'text/html',
	'ico':'image/x-icon',
	'ics':'text/calendar',
	'jpeg':'image/jpeg',
	'jpg':'image/jpeg',
	'js':'text/javascript',
	'm3u':'audio/x-mpegurl',
	'm4a':'audio/mp4a-latm',
	'm4b':'audio/mp4a-latm',
	'm4p':'audio/mp4a-latm',
	'm4u':'video/vnd.mpegurl',
	'm4v':'video/x-m4v',
	'mov':'video/quicktime',
	'mp2':'audio/mpeg',
	'mp3':'audio/mpeg',
	'mp4':'video/mp4',
	'mpeg':'video/mpeg',
	'mpg':'video/mpeg',
	'mpga':'audio/mpeg',
	'png':'image/png',
	'svg':'image/svg+xml',
	'swf':'application/x-shockwave-flash',
	'txt':'text/plain',
	'wav':'audio/x-wav',
	'xht':'application/xhtml+xml',
	'xhtml':'application/xhtml+xml',
	'xml':'application/xml',
	'xsl':'application/xml',
	'xslt':'application/xslt+xml',
	'xul':'application/vnd.mozilla.xul+xml',
	'manifest':'text/cache-manifest',
	'ttf':'font/ttf',
	'woff':'application/font-woff',
	'json':'application/json'
};

function readFile(filepath,req,res,next) {
	logger.trace("readFile",filepath);
	var mimetype = mimetypes[require('path').extname(filepath).substr(1)];
	var stats = fs.statSync(filepath);

	if(stats.isDirectory()) {
		// console.log("this is a directory");
		res.send(405);
		return next(false);
	}
	if(config.cache && req.headers['if-modified-since'] && (new Date(req.headers['if-modified-since'])).valueOf() === ( new Date(stats.mtime)).valueOf() ) {
		res.statusCode = 304;
		res.end();
		return next();
	} else {
		var raw = fs.createReadStream(filepath);
		raw.on("open",function(fd) {
			res.set("Content-Type", mimetype);
			res.set("Content-Length",stats.size);
			res.set("Cache-Control","public");
			res.set("Last-Modified",stats.mtime);
			res.writeHead(200);
			raw.pipe(res);

			raw.once('end', function () {
				next(false);
			});
		});
	}
}

function send404(req,res,next) {
	res.writeHead(404, {"Content-Type": "text/html"});
	res.write("404 Not Found\n");
	res.end();
	return next();
}

function serveStatic(req,res,next) {
	logger.trace("serveStatic");
	var uri      = require('url').parse(req.url).pathname;
	var filepath = decodeURIComponent((uri==="/")?path.join(DOCUMENT_ROOT, '/index.htm'):path.join(DOCUMENT_ROOT, uri));
	if(!filepath) {
		return next();
	}

	fs.exists(filepath, function(exists){
		if(!exists){
			logger.warning("error 404 : "+filepath);
			send404(req,res,next);
			return next();
		}
		readFile(filepath,req,res,next);
	});
}

// ===================================================
//               API requests

// Authent
server.post( '/api/checkpasswd', checkPasswd);

// Menus
server.get( '/api/menu', IMenu.getMenu);

// Rights
server.put( '/api/rights', IMenu.putRights);

server.get( '/api/directory/export', ICSV.getDirectory);
server.get( '/api/directory', IDirectory.getEntries);
server.post('/api/directory', IDirectory.createEntry);
server.get( '/api/directory/:entryID', IDirectory.getEntry );
server.put( '/api/directory/:entryID', IDirectory.updateEntry );
server.del( '/api/directory/:entryID', IDirectory.deleteEntry );
server.post('/api/directory/:entryID/account', IDirectory.accountUpdate );
server.get( '/api/directory/:entryID/account', IDirectory.account );
server.get( '/api/directory/:entryID/cert', IDirectory.createCert );
server.del( '/api/directory/:entryID/cert', IDirectory.revoqCert );

server.get( '/api/beneficiaries', IBeneficiary.getBeneficiaries);   // get beneficiaries list
server.post('/api/beneficiaries', IBeneficiary.createBeneficiary);
server.post('/api/beneficiaries/filter', IBeneficiary.getBeneficiariesFilter);
server.get( '/api/beneficiaries/:entryID', IBeneficiary.getBeneficiary );
server.put( '/api/beneficiaries/:entryID', IBeneficiary.updateBeneficiary );
server.del( '/api/beneficiaries/:entryID', IBeneficiary.deleteBeneficiary );
server.get( '/api/beneficiaries/:entryID/professionals', IBeneficiary.beneficiaryProfessionals );
server.post('/api/beneficiaries/:entryID/professionals', IBeneficiary.beneficiaryAddProfessional );
server.del( '/api/beneficiaries/:entryID/professionals/:profID', IBeneficiary.beneficiaryDelProfessional );
server.get( '/api/beneficiaries/:entryID/select', IBeneficiary.selectBeneficiary );

server.get( '/api/beneficiaries/:entryID/cert', IBeneficiary.createCert );
server.del( '/api/beneficiaries/:entryID/cert', IBeneficiary.revoqCert );

// graph Data
server.get( '/api/beneficiary/graph', IBeneficiary.getGraphDataList );
server.get( '/api/beneficiary/graph/:category/:paramName', IBeneficiary.getGraphData );
server.get( '/api/beneficiaries/:entryID/graph', IBeneficiary.getGraphDataList );
server.get( '/api/beneficiaries/:entryID/graph/:category/:paramName', IBeneficiary.getGraphData );
server.get( '/api/beneficiary/history', IBeneficiary.getHistoryDataList );

// use of the session to determine the selected beneficiary
server.get( '/api/beneficiary', IBeneficiary.getBeneficiary  );
server.get( '/api/beneficiary/professionals', IBeneficiary.beneficiaryProfessionals );
server.get( '/api/beneficiary/datarecords', IBeneficiary.dataRecords );
server.get( '/api/beneficiary/datarecords/:dataRecordID', IBeneficiary.dataRecord );
server.post('/api/beneficiary/datarecord', IBeneficiary.newDataRecord );
server.get( '/api/beneficiary/datarecords/:dataRecordID/warning', IBeneficiary.checkWarning );
server.put( '/api/beneficiary/datarecords/:dataRecordID', IBeneficiary.updateDataRecord );
server.post('/api/beneficiary/thresholds', IBeneficiary.setThreshold);
server.get( '/api/beneficiary/thresholds', IBeneficiary.getThreshold);
server.del( '/api/beneficiary/datarecords/:dataRecordID', IBeneficiary.removeDataRecord );
server.get( '/api/beneficiary/status', IBeneficiary.getBioMasterStatus );

// messages to home
server.get( '/api/beneficiary/messages', IBeneficiary.getMessages );
server.get( '/api/beneficiaries/:entryID/messages', IBeneficiary.getMessages );
server.post('/api/beneficiary/messages', IBeneficiary.createMessage );
server.post('/api/beneficiaries/:entryID/messages', IBeneficiary.createMessage );
server.post('/api/beneficiaries/message',IBeneficiary.postMessageToList);

server.get( '/api/beneficiary/dataprog', IBeneficiary.getDataProg );
server.get( '/api/beneficiary/dataprog/:category', IBeneficiary.getDataProgCategory );
server.get( '/api/beneficiaries/:entryID/dataprog/:category', IBeneficiary.getDataProgCategory );
server.post('/api/beneficiary/dataprog', IBeneficiary.setDataProg );
server.post('/api/beneficiaries/:entryID/dataprog', IBeneficiary.setDataProg );
server.del( '/api/beneficiary/dataprog/:dataProgItemID', IBeneficiary.removeDataProg );
server.del( '/api/beneficiaries/:entryID/dataprog/:dataProgItemID', IBeneficiary.removeDataProg );

server.get( '/api/beneficiary/current/validation', ICurrentStatus.isValidated);

server.get( '/api/beneficiary/current/:name', ICurrentStatus.get);
server.put( '/api/beneficiary/current/:name', ICurrentStatus.put);

// Questionnaire answers for the current beneficiary
server.post('/api/beneficiary/questionnaires/:entryID/answers', IBeneficiary.createQuestionnaireAnswers);
server.del('/api/beneficiary/questionnaires/answers/:entryID', IBeneficiary.removeQuestionnaireAnswers);

//Events
server.get( '/api/beneficiary/events', IBeneficiary.getEventList);
server.post( '/api/beneficiary/warning', IBeneficiary.setWarningStatus );

//Dietary Plan
server.get( '/api/beneficiary/dietary-plan', IBeneficiary.getDietaryPlan);
server.post('/api/beneficiary/dietary-plan', IBeneficiary.createDietaryPlan);
server.get( '/api/beneficiary/dietary-plans', IBeneficiary.getDietaryPlanList);
//Physical Plan
server.get( '/api/beneficiary/physical-plan', IBeneficiary.getPhysicalPlan);
server.post('/api/beneficiary/physical-plan', IBeneficiary.createPhysicalPlan);
server.get( '/api/beneficiary/physical-plans', IBeneficiary.getPhysicalPlanList);

server.get( '/api/beneficiary/questprog', IBeneficiary.getQuestProg );
server.get( '/api/beneficiaries/:entryID/questprog', IBeneficiary.getQuestProg );
server.post('/api/beneficiary/questprog/:ref', IBeneficiary.addQuestProg );
server.post('/api/beneficiaries/:entryID/questprog/:ref', IBeneficiary.addQuestProg );
server.del( '/api/beneficiary/questprog/:ref', IBeneficiary.delQuestProg );
server.del( '/api/beneficiaries/:entryID/questprog/:ref', IBeneficiary.delQuestProg );
server.put( '/api/beneficiary/questprog', IBeneficiary.setQuestProg );
server.put( '/api/beneficiaries/:entryID/questprog', IBeneficiary.setQuestProg );

server.get( '/api/beneficiary/services', IServices.getServices );
// for agenda display
server.get( '/api/beneficiary/services/items', IServices.getServicesItems ); 
// for agenda on HHR-Home
server.get( '/api/beneficiary/services/queueitems', IServices.getServicesQueueItems );
server.del( '/api/beneficiary/services/queueitems', IServices.clearServicesQueueItems );
server.get( '/api/beneficiary/services/:serviceID', IServices.getServiceByID );
server.put( '/api/beneficiary/services', IServices.putService );
server.del( '/api/beneficiary/services/:serviceID', IServices.removeService );

server.get( '/api/beneficiary/socialReport', ISocialReport.getLastReport );
server.put( '/api/beneficiary/socialReport', ISocialReport.setLastReport );

server.get( '/api/beneficiary/specificData/summary', ISpecificData.getDataSummary );
server.get( '/api/beneficiary/specificData/events', ISpecificData.getDataEvents );
server.put( '/api/beneficiary/specificData', ISpecificData.setDataEvent );
// server.get( '/api/beneficiary/questprog/:quest', IBeneficiary.getDataProgCategory );

//DEV ONLY for creation & update
server.get( '/api/questionnaires', IQuestionnaire.getList );
server.get( '/api/questionnaires/:entryID', IQuestionnaire.getQuestionnaire );
server.post('/api/questionnaires', IQuestionnaire.createQuestionnaire);
server.put( '/api/questionnaires/:entryID', IQuestionnaire.updateQuestionnaire);
//DEV ONLY

server.get( '/api/sessions/', getSessions);

server.get( '/api/lists', ILists.getLists );
server.get( '/api/lists/:listName', ILists.getList );
server.get( '/api/lists/:listName/array', ILists.getListArray );
server.get( '/api/lists/:listName/translate', ILists.getListTranslate );
server.get( '/api/lists/:listName/:itemRef', ILists.getItem );
server.put( '/api/lists/:listName', ILists.updateList );
server.post('/api/lists/:listName', ILists.addItem );
server.put( '/api/lists/:listName/:itemRef', ILists.translateItem );
server.post('/api/lists/:listName/:itemRef', ILists.activateItem );

server.post('/api/login', apiLogin);
server.post('/api/password', apiPassword);
server.get( '/api/logout', logout);

// ===================================================
//              Queue messages
server.get( '/api/hhr',                          IBeneficiary.getHHRs );
server.get( '/api/queue/init',                   IQueue.init );
server.get( '/api/queue/firstname',              IQueue.firstname );
server.post('/api/queue/status',                 IQueue.status );
server.get( '/api/queue/messages',               IQueue.messages);
server.get( '/api/queue/history',                IQueue.history);
server.get( '/api/queue/history/:category',      IQueue.history);
server.get( '/api/queue/dhdffq',                 IQueue.dhdffq);
server.get( '/api/queue/measurePlan',            IQueue.measurePlan);
server.get( '/api/queue/symptomPlan',            IQueue.symptomPlan);
server.get( '/api/queue/physicalPlan',           IQueue.physicalPlan);
server.get( '/api/queue/dietaryPlan',            IQueue.dietaryPlan);
server.get( '/api/queue/symptomsSelf',           IQueue.symptomsSelf);
server.get( '/api/queue/services',               IQueue.services);
server.get( '/api/queue/servicesPlan',           IQueue.servicesPlan);
server.post('/api/queue/received',               IQueue.receivedMsg);

server.get( '/api/queue/:hhr/init',              IQueue.init );
server.get( '/api/queue/:hhr/messages',          IQueue.messages);
server.get( '/api/queue/:hhr/history',           IQueue.history);
server.get( '/api/queue/:hhr/history/:category', IQueue.history);
server.get( '/api/queue/:hhr/dhdffq',            IQueue.dhdffq);
server.get( '/api/queue/:hhr/measurePlan',       IQueue.measurePlan);
server.get( '/api/queue/:hhr/symptomPlan',       IQueue.symptomPlan);
server.get( '/api/queue/:hhr/physicalPlan',      IQueue.physicalPlan);
server.get( '/api/queue/:hhr/dietaryPlan',       IQueue.dietaryPlan);
server.get( '/api/queue/:hhr/symptomsSelf',      IQueue.symptomsSelf);

// ===================================================
//               Pages requests

function version(req, res, next) {
	logger.trace("get version");
	res.write( "version : " + pkg.version+"\n" );
	res.write( "node version : " + process.version + "\n" );
	res.write( "modules : \n");
	for( var pack in pkg.dependencies) {
		res.write( "    "+pack+" version "+pkg.dependencies[pack]+"\n");
	}
	res.end();
	next(false);
}
server.get( '/version', version);

server.get( '/createunit', ILogIDS.createUnit);

server.get( '/logout', logout);

server.get( '/beneficiaries', IPage.beneficiaries);
server.get( '/beneficiaries/create', IPage.beneficiaryCreate);
server.get( '/beneficiary/edit/:beneficiaryID', IPage.beneficiaryUpdate);
server.get( '/beneficiary/update', IPage.beneficiaryUpdate );
server.get( '/beneficiary/:beneficiaryID', IPage.beneficiaryOverview );

server.get( '/IDSLog', IPage.IDSLog);

server.get( '/agenda', IPage.agenda);

server.get( '/directory', IPage.directoryList);
server.get( '/directory/create', IPage.directoryUpdate);
server.get( '/directory/:professionalID', IPage.directoryUpdate);
server.get( '/settings/lists', IPage.lists);
server.get( '/settings/lists/:listName', IPage.list);
server.get( '/questionnaires', IPage.questionnaires);
server.get( '/questionnaires/create', IPage.createQuestionnaire);
server.get( '/questionnaires/edit/:questionnaireName', IPage.createQuestionnaire);
server.get( '/questionnaires/preview/:questionnaireName', IPage.questionnairePreview);
server.get( '/questionnaire/:questionnaireName', IPage.questionnaireOverview);

server.get( '/answers/:entryID', IPage.questionnaireAnswers);

server.get( '/datarecord', IPage.dataRecord);
server.get( '/datarecord/create', IPage.dataRecordCreate);
server.get( '/datarecord/synthesis', IPage.dataRecordSynthesis);
server.get( '/datarecord/:dataRecordID', IPage.dataRecordDetail);

server.get( '/specificData', IPage.specificData);

server.get( '/physiological-data', IPage.physiologicalData);
server.get( '/message', IPage.messageList);
server.get( '/message/create', IPage.messageCreate);
server.get( '/message/list', IPage.messageToList);

// Services
server.get( '/services/health', IPage.basicHealthServices);
server.get( '/services/health/create', IPage.basicHealthServiceCreate);
server.get( '/services/social', IPage.basicSocialServices);

server.get( '/social/report', IPage.socialReport);

// Current (initial) health status
server.get( '/current/:name', IPage.currentHealthStatus);

server.get( '/prescription/general', IPage.prescriptionDataGeneral);
server.get( '/prescription/hdim', IPage.prescriptionDataHDIM);
server.get( '/prescription/symptom', IPage.prescriptionDataSymptom);
server.get( '/prescription/questionnaire', IPage.prescriptionQuestionnaire);

server.get( '/admin/rights', IPage.rights);

server.get( '/dietary-plan', IPage.dietaryPlan);
server.get( '/physical-plan', IPage.physicalPlan);

server.get(/\/[^api|components\/]?$/, function(req, res, next) {
	logger.trace("index" );
	if( req.session ) {
		if( req.session.firstlogin ) {
			return IPage.password( req, res, next);
		} else {
			return IPage.ui(req, res, next);
		}
	} else {
		// logger.debug( req.headers );
		var cookies = new Cookies(req, res);
		
		if ( req.headers["ids-user"] ) {
			physioDOM.getAccountByIDSUser( req.headers["ids-user"] )
				.then( function(account) {
					return account.createSession();
				}).then( function(session) {
					// console.log( session );
					req.session = session;
					cookies.set('sessionID', session.sessionID, cookieOptions);
					cookies.set('role', session.role, { path: '/', httpOnly : false} );
					cookies.set('lang', session.lang || physioDOM.lang, { path: '/', httpOnly : false});
					if( session.firstlogin === true ) {
						return IPage.password( req, res, next);
					} else {
						return IPage.ui(req, res, next);
					}
				})
				.catch( function(err) {
					logger.warning(err.message || "bad login or password");
					cookies.set('sessionID');
					cookies.set('role');
					res.send( 403, {code:403, message:"bad credentials"} );
					next();
				});
		} else {
			cookies.set('lang', physioDOM.lang, cookieOptions);
			return IPage.login(req, res, next);
		}
	}
});

server.get(/\/[^api\/]?.*/, serveStatic );

// starts the server but before ensures that the db is open
physioDOM.connect()
	.then( function() {
		server.listen(config.port, "127.0.0.1", function () {
			logger.info('------------------------------------------------------------------');
			logger.info(server.name +'v'+ server.version + ' listening at ' + server.url);
			logger.info("config\n", JSON.stringify(config,"",4) );
			logger.info('------------------------------------------------------------------');
		});
	})
	.catch(function() {
		logger.emergency('==================================================================');
		logger.emergency("connection to database failed");
		logger.emergency("HHR-Pro instance not started");
		logger.emergency('==================================================================');
		process.exit(1);
	});


