/* jslint node:true */

"use strict";

var restify = require("restify"),
		fs      = require('fs'),
		program = require("commander"),
		RSVP    = require("rsvp"),
		path    = require("path"),
		zlib    = require("zlib"),
		Cookies = require("cookies");
var pkg     = require('../package.json');

var DOCUMENT_ROOT = __dirname+"/../static";

var config =  { cache : true };

var cookieOptions = {
			path: '/',
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
	console.log(ipAddress, req.method, req.url);
	console.log(" ", "cookies : ", req.cookies);
	console.log(" ", "params : ", req.params);
	console.log(" ", "body : ", req.body ? req.body.toString() : "");
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
	console.log(ipAddress, req.method, req.url, res.statusCode, responseTime);
	return;
}

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

server.post('/api/login', login);
server.post(/\/?$/, login);
server.get(/\/?.*/, serveStatic );

server.listen(program.port, "127.0.0.1", function() {
	console.log('%s listening at %s', server.name, server.url);
});

function login(req,res,next) {
	console.log("login",req.params, req.body);
	var params = require("querystring").parse(req.body);
	console.log("params",params);
	var cookies = new Cookies(req, res);
	
	if( params.login === "login" && params.passwd === "passwd") {
		cookies.set('uuid', "login", cookieOptions);
		var filepath = path.join(DOCUMENT_ROOT, '/ui.htm');
		return readFile(filepath,req,res,next);
		// res.send(302,'/ui.htm');
	} else {
		console.log('unset cookies');
		cookies.set('uuid');
		var filepath = path.join(DOCUMENT_ROOT, '/index.htm');
		return readFile(filepath,req,res,next);
		//res.send();
	}
	// next();
}

function serveStatic(req,res,next) {
	var uri      = require('url').parse(req.url).pathname;
	var filepath = decodeURIComponent((uri=="/")?path.join(DOCUMENT_ROOT, '/index.htm'):path.join(DOCUMENT_ROOT, uri));
	if(!filepath) return next();

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

	if(config.cache && req.headers['if-modified-since'] && (new Date(req.headers['if-modified-since'])).valueOf() == ( new Date(stats.mtime)).valueOf() ) {
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
				console.log("end");
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
	'woff':'application/font-woff'
};