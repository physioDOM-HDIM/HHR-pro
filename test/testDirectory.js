/* jslint node:true */
"use strict";

var request = require("request"),
	should = require('chai').should(),
	querystring = require("querystring");

var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies
var sessionCookie = request.jar();

suite('Directory', function() {
	
	test('login by header', function(done) {
		var cookie = request.jar();
		request({url           : domain + '/api/login',
			method             : "POST",
			auth               : {username: 'archer', password: 'test'},
			jar                : cookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			var cookies = querystring.parse(cookie.getCookieString(domain), ";");
			cookies.should.have.property("sessionID");
			return done();
		});
	});
	
	test('login by POST', function(done) {
		request({url           : domain + '/api/login',
			method             : "POST",
			jar                : sessionCookie,
			encoding           : 'utf-8',
			form	           : JSON.stringify({ login:"archer", password:"test"})
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			var cookies = querystring.parse(sessionCookie.getCookieString(domain), ";");
			cookies.should.have.property("sessionID");
			cookies = sessionCookie.getCookies(domain);
			cookies.should.have.length(1);
			cookies[0].should.have.property("httpOnly");
			cookies[0].httpOnly.should.be.true;
			cookies[0].should.have.property("hostOnly");
			cookies[0].hostOnly.should.be.true;
			cookies[0].should.have.property("path");
			cookies[0].path.should.equal("/");
			return done();
		});
	});
	
	test('get directory', function(done) {
		request({url           : domain + '/api/directory',
			method             : "GET",
			jar                : sessionCookie
		}, function (err, resp, body) {
			var list;
			
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.be.a("string");
			try {
				list = JSON.parse(body);
				list.should.be.an('object');
				list.should.have.property("nb");
				list.should.have.property("pg");
				list.should.have.property("offset");
				list.should.have.property("items");
				list.items.should.be.an("array");
			} catch(err) {
				console.log(err);
			}
			return done();
		});
	})
	
	test('logout', function(done) {
		request({url           : domain + '/api/logout',
			method             : "GET",
			jar                : sessionCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			sessionCookie.getCookieString(domain).should.equal("");
			return done();
		});
	})
	
});