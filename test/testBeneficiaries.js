/* jslint node:true */
/* jshint expr:true */
/* global describe, it */
"use strict";

var request = require("request"),
	should = require('chai').should(),
	querystring = require("querystring"),
	testCommon = require("./testCommon");

var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies
var sessionCookie = request.jar();

var entry1, entry2;   // entries created during tests

describe('Beneficiaries', function() {

	before(function ( done ) {
		testCommon.before()
			.then( function() {
				done();
			})
			.catch( function(err) {
				console.error("error when initializing the database");
				throw err;
				done();
			});
	});

	it('login by header', function (done) {
		var cookie = request.jar();
		request({
			url   : domain + '/api/login',
			method: "POST",
			auth  : {username: 'archer', password: 'test'},
			jar   : cookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			var cookies = querystring.parse(cookie.getCookieString(domain), ";");
			cookies.should.have.property("sessionID");
			return done();
		});
	});

	it('get beneficiaries (coordinator)', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('get beneficiaries (coordinator) pg=3', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('get beneficiaries (coordinator) offset=30', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('get beneficiaries (admin)', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('get beneficiaries (professional)', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('get beneficiaries (beneficiary)', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('get beneficiaries (no user)', function (done) {
		throw {error: "not yet implemented"};
		done();
	});

	it('logout', function (done) {
		request({
			url   : domain + '/api/logout',
			method: "GET",
			jar   : sessionCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			sessionCookie.getCookieString(domain).should.equal("");
			return done();
		});
	});

	after(function () {
		console.log("recover database");
	});
});