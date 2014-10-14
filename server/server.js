/* jslint node:true */

"use strict";

var restify = require("restify"),
		fs      = require('fs'),
		program = require("commander"),
		RSVP    = require("rsvp"),
		path    = require("path"),
		zlib    = require("zlib"),
		Cookies = require("cookies"),
		moment  = require("moment"),
		Logger = require("logger"),
		MongoClient = require("mongodb").MongoClient,
		ObjectID = require("mongodb").ObjectID,
		PhysioDOM = require("./lib/physiodom");

var pkg     = require('../package.json');
var logger = new Logger( "PhysioDOM ");
var DOCUMENT_ROOT = __dirname+"/../static";

var config =  { cache : true };

var cookieOptions = {
	path: '/',
	httpOnly : true
};

program
	.version(pkg.version)
	.usage('[options] [dir]')
	.option('-p, --port <port>', 'specify the port [3000]', Number, 3000)
	.parse(process.argv);

/**
 *
 */
function requestLog(req, res) {
	var ipAddress = req.headers['x-forwarded-for'] === undefined ? req.connection.remoteAddress : req.headers['x-forwarded-for'];
	logger.info(ipAddress, req.method, req.url);
	logger.debug(" ", "cookies : ", req.cookies);
	logger.debug(" ", "params : ", req.params);
	logger.debug(" ", "body : ", req.body ? req.body.toString() : "-");
	return;
}

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

var physioDOM = new PhysioDOM();
physioDOM.connect("mongodb://127.0.0.1/physioDOM");

var server = restify.createServer({
	name:    pkg.name,
	version: pkg.version
});

server.pre(function(req, res, next) {
	var ipAddress = req.headers['x-forwarded-for'] === undefined ? req.connection.remoteAddress : req.headers['x-forwarded-for'];
	req.ipAddress = ipAddress;
	return next();
});

server.use( function(req, res, next) {
	req.cookies = {};
	req.headers.cookie && req.headers.cookie.split(';').forEach( function( cookie ) {
		var parts = cookie.split('=');
		req.cookies[ parts[0].trim() ] = ( parts[1].trim() || '' );
	});
	requestLog(req, res);
	return next();
});

server.use(restify.gzipResponse());
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.pre(restify.pre.userAgentConnection());

server.use(function checkAcl(req, res, next) {
	logger.trace("checkAcl",req.url);
	var cookies = new Cookies(req, res);

	if( req.url.match(/^(\/|\/api\/login)$/) ) {
		return next();
	}
	if(!req.cookies.sessionID) {
			logger.warning("not authorized");
			res.send(403);
			return next(false);
	} else {
		physioDOM.getSession(req.cookies.sessionID)
			.then( function(session) {
				if( session.expire - (new Date()).getTime() < 0 ) {
					logger.warning( "session has expired");
					cookies.set('sessionID');
					if( req.url.match(/^\/api/)) {
						res.send(403, { code:"EXPIRED", msg:"session has expired"});
						return next(false);
					} else {
						return readFile(path.join(DOCUMENT_ROOT, '/index.htm'), req, res, next);
					}
				} else {
					
					logger.debug("session expires at "+ moment().add( session.expire - (new Date()).getTime(), 'ms' ).format());
					return next();
				}
			})
			.catch( function(err) {
				console.log("Error ", err);
				cookies.set('sessionID');
				res.send(403);
				return next(false);
			});
	}
});

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
});

server.post(/\/api\/login/, apiLogin);
server.post(/\/api\/logout/, logout);
server.post(/\/?$/, login);
server.get(/\/?logout$/, logout);
server.get(/\/api\/beneficiaries/, getBeneficiaries);
server.get(/\/api\/directory/, getDirectory);
server.get(/\api\/sessions/, getSessions);

server.get(/\/[^api\/]?$/, function(req, res, next) {
	logger.trace("index");
	if( req.cookies.sessionID ) {
		return readFile(path.join(DOCUMENT_ROOT, '/ui.htm'), req, res, next);
	} else {
		return readFile(path.join(DOCUMENT_ROOT, '/index.htm'), req, res, next);
	}
});

server.get(/\/[^api\/]?.*/, serveStatic );

server.listen(program.port, "127.0.0.1", function() {
	console.log('%s listening at %s', server.name, server.url);
});

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
		body = req.body.toString();
	}
	
	cookies = new Cookies(req, res);
	
	try {
		var user = JSON.parse( body );
		if( !user.login || !user.password ) {
			cookies.set('sessionID');
			logger.warning("no login or password");
			res.send(403);
			return next(false);
		} else {
			physioDOM.getAccountByCredentials(user.login, user.password )
				.then( function(account) {
					return account.createSession();
				})
				.then( function(session) {
					cookies.set('sessionID', session.sessionID, cookieOptions);
					res.send(200);
					return next();
				})
				.catch( function(err) {
					logger.warning("bad login or password");
					cookies.set('sessionID');
					res.send(403);
					return next(false);
				});
		}
	} catch(err) {
		logger.warning("bad json format");
		cookies.set('sessionID');
		res.send(403);
		return next(false);
	}
}

function login(req,res,next) {
	logger.trace("login",req.params);
	var cookies = new Cookies(req, res);
	
	if( req.params.login && req.params.passwd) {
		// check if an account exists and is active
		physioDOM.getAccountByCredentials(req.params.login, req.params.passwd )
			.then( function(account) {
				return account.createSession();
			})
			.then( function(session) {
				cookies.set('sessionID', session.sessionID, cookieOptions);
				var filepath = path.join(DOCUMENT_ROOT, '/ui.htm');
				return readFile(filepath, req,res,next);
			})
			.catch( function(err) {
				console.log("Error ",err);
				cookies.set('sessionID');
				res.header('Location', '/#401');
				res.send(302);
				return next();
			});
	} else {
		cookies.set('sessionID');
		res.header('Location', '/#403');
		res.send(302);
		return next();
	}
}

function logout(req, res, next ) {
	console.log("logout");
	var cookies = new Cookies(req, res);

	physioDOM.deleteSession( cookies.get("sessionID") )
		.catch( function(err) { 
			console.log("Error ",err);
		}).finally( function() {
			console.log('unset cookies');
			cookies.set('sessionID');
			if(req.url.match(/^\/api/)) {
				res.send(200);
			} else {
				res.header('Location', '/');
				res.send(302);
			}
			return next();
		});
}

function getBeneficiaries(req, res, next) {
	console.log("getBeneficiaries");
	var pg = parseInt(req.params.pg,10) || 1;
	var offset = parseInt(req.params.offset,10) || 10;
	
	physioDOM.getBeneficiaries(pg, offset)
		.then(function(list) {
			res.send(list);
			next();
		});
}

function getDirectory( req, res, next ) {
	console.log("getDirectory");
	var pg = parseInt(req.params.pg,10) || 1;
	var offset = parseInt(req.params.offset,10) || 10;
	var sort = req.params.sort;
	
	physioDOM.getDirectory(pg, offset, sort)
		.then(function(list) {
			res.send(list);
			next();
		});
}

function getSessions( req, res, next ) {
	console.log("getSessions");
	var pg = parseInt(req.params.pg,10) || 1;
	var offset = parseInt(req.params.offset,10) || 10;
	var sort = req.params.sort;

	physioDOM.getSessions(pg, offset, sort)
		.then(function(list) {
			res.send(list);
			next();
		});
}

function serveStatic(req,res,next) {
	console.log("serveStatic");
	var uri      = require('url').parse(req.url).pathname;
	var filepath = decodeURIComponent((uri=="/")?path.join(DOCUMENT_ROOT, '/index.htm'):path.join(DOCUMENT_ROOT, uri));
	if(!filepath) {
		return next();
	}

	fs.exists(filepath, function(exists){
		if(!exists){
			console.log("error 404 : "+filepath);
			send404(req,res,next);
			return next();
		}
		readFile(filepath,req,res,next);
	});
}

function readFile(filepath,req,res,next) {
	console.log("readFile",filepath);
	var mimetype = mimetypes[require('path').extname(filepath).substr(1)];
	var stats = fs.statSync(filepath);

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
