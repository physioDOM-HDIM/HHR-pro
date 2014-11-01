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


var newEntry1 = {
	name: {
		family:"Einstein",
		given:"Albert"
	},
	gender:"M",
	telecom: [
		{
			system:"email",
			value:"albert.einstein@physiodom.loc"
		},{
			system:"phone",
			value:"025558888"
		}
	],
	birthdate: "1950-06-22",
	validate:false
};

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
			jar   : sessionCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			var cookies = querystring.parse(sessionCookie.getCookieString(domain), ";");
			cookies.should.have.property("sessionID");
			return done();
		});
	});

	it('get beneficiaries (coordinator)', function (done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "GET",
			jar                : sessionCookie
		}, function (err, resp, body) {
			var list;

			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.be.a("string");

			list = JSON.parse(body);
			list.should.be.an('object');
			list.should.have.property("nb");
			list.should.have.property("pg");
			list.should.have.property("offset");
			list.should.have.property("items");
			list.items.should.be.an("array");
			list.nb.should.be.equal(34);
			list.items.should.have.length(20);

			return done();
		});
	});

	it('get beneficiaries (coordinator) pg=3', function (done) {
		request({url           : domain + '/api/beneficiaries?pg=2',
			method             : "GET",
			jar                : sessionCookie
		}, function (err, resp, body) {
			var list;

			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.be.a("string");

			list = JSON.parse(body);
			list.should.be.an('object');
			list.should.have.property("nb");
			list.should.have.property("pg");
			list.should.have.property("offset");
			list.should.have.property("items");
			list.items.should.be.an("array");
			list.nb.should.be.equal(34);
			list.items.should.have.length(14);

			return done();
		});
	});

	it('get beneficiaries (coordinator) offset=10', function (done) {
		request({url           : domain + '/api/beneficiaries?pg=3&offset=10',
			method             : "GET",
			jar                : sessionCookie
		}, function (err, resp, body) {
			var list;

			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.be.a("string");

			list = JSON.parse(body);
			list.should.be.an('object');
			list.should.have.property("nb");
			list.should.have.property("pg");
			list.should.have.property("offset");
			list.should.have.property("items");
			list.items.should.be.an("array");
			list.nb.should.be.equal(34);
			list.items.should.have.length(10);

			return done();
		});
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

	it('create a beneficiary ( must be JSON )', function(done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "POST",
			jar                : sessionCookie,
			form	           : newEntry1
		}, function (err, resp, body) {
			var error;
			should.not.exist(err);
			resp.statusCode.should.equal(405);
			error = JSON.parse(body);
			error.should.have.property("message");
			error.message.should.equal("bad json format");
			return done();
		});
	});
	
	it('create a beneficiary', function(done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "POST",
			jar                : sessionCookie,
			form	           : JSON.stringify(newEntry1)
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.be.a("string");
			try {
				item = JSON.parse(body);

			} catch(err) {
				throw {err:"bad json format"};
				// return done();
			}
			finally {
				item.should.have.property("_id");
				for( var key in newEntry1) {
					if(newEntry1.hasOwnProperty(key)) {
						item.should.have.property(key);
						item[key].should.be.eql(newEntry1[key]);
					}
				}
				entry1 = item;
				return done();
			}
		});
	});

	it('duplicate error (same name, birthdate and telecom)', function(done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "POST",
			jar                : sessionCookie,
			form	           : JSON.stringify(newEntry1)
		}, function (err, resp, body) {
			var error;
			should.not.exist(err);
			resp.statusCode.should.equal(400);
			error = JSON.parse(body);
			error.should.have.property("error");
			error.error.should.equal("duplicate");
			return done();
		});
	});

	it('get a beneficiary', function(done) {
		request({url           : domain + '/api/beneficiaries/'+entry1._id,
			method             : "GET",
			jar                : sessionCookie
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			item = JSON.parse(body);
			for( var prop in item ) {
				if(item.hasOwnProperty(prop)) {
					item[prop].should.eql(entry1[prop]);
				}
			}
			return done();
		});
	});

	it('get a beneficiary ( no session )', function(done) {
		request({url           : domain + '/api/beneficiaries/'+entry1._id,
			method             : "GET"
		}, function (err, resp, body) {
			var error;
			should.not.exist(err);
			resp.statusCode.should.equal(403);
			error = JSON.parse(body);
			error.error.should.equal(403);
			error.message.should.equal("no session");
			return done();
		});
	});
	
	it('update a beneficiary', function(done) {
		entry1.entry = {
			"demand":"this patient could subscribe to this program",
			"startDate":"2015-03-10",
			"plannedEnd": "2016-02-20"
		};
		request({url           : domain + '/api/beneficiaries/'+entry1._id,
			method             : "PUT",
			jar                : sessionCookie,
			headers            : { "content-type":"text/plain"},
			body               : JSON.stringify(entry1)
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			var item = JSON.parse(body);
			for( var prop in item ) {
				if(item.hasOwnProperty(prop)) {
					item[prop].should.eql(entry1[prop]);
				}
			}
			return done();
		});
	});
	
	it('delete a beneficiary', function(done) {
		request({url           : domain + '/api/beneficiaries/'+entry1._id,
			method             : "DELETE",
			jar                : sessionCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(410);
			var error = JSON.parse(body);
			error.code.should.equal(410);
			error.message.should.equal("entry deleted");
			return done();
		});
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