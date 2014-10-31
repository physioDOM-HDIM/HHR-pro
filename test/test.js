/* jslint node:true */
"use strict";

var request = require("request"), 
	should = require('chai').should(),
	querystring = require("querystring");

var cook = request.jar();
var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies

request( { url:domain+'/api/login', method:"post", auth: { username:'archer', password:'test' }, jar:cook, rejectUnhauthorized : false, strictSSL: false }, function(err, resp, body) {
	should.not.exist(err);
	resp.statusCode.should.equal(200);
	body.should.equal("");
	var cookies = querystring.parse(cook.getCookieString(domain),";");
	cookies.should.have.property("sessionID");
});

