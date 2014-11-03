/* jslint node:true */
/* jshint expr:true */
/* global describe, it */
"use strict";

var request = require("request"),
	should = require('chai').should(),
	querystring = require("querystring"),
	testCommon = require("./testCommon");

var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies
var sessionCookies = [];
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
				return testCommon.login({login: 'archer', password: 'test'} );
			})
			.then( function( cookie ) {
				sessionCookies.push(cookie);
				return testCommon.login({login: 'admin', password: 'physiodom'} );
			})
			.then( function( cookie ) {
				sessionCookies.push(cookie);
				return testCommon.login({login: 'cburton', password: 'cburton'} );
			})
			.then( function( cookie ) {
				sessionCookies.push(cookie);
				return testCommon.login({login: 'pleavitt', password: 'pleavitt'} );
			})
			.then( function( cookie ) {
				sessionCookies.push(cookie);
				done();
			})
			.catch( function(err) {
				console.error("error when initializing the database");
				throw err;
				done();
			});
	});
	
	it('get beneficiaries (coordinator)', function (done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "GET",
			jar                : sessionCookies[0]
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
			jar                : sessionCookies[0]
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
			jar                : sessionCookies[0]
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
		request({url           : domain + '/api/beneficiaries',
			method             : "GET",
			jar                : sessionCookies[1]
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

	it('get beneficiaries (professional)', function (done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "GET",
			jar                : sessionCookies[2]
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
			list.nb.should.be.equal(0);
			list.items.should.have.length(0);

			return done();
		});
	});

	/*
	it('get beneficiaries (beneficiary)', function (done) {
		throw {error: "not yet implemented"};
		done();
	});
	*/

	it('get beneficiaries (no user)', function (done) {
		request({url           : domain + '/api/beneficiaries?pg=3&offset=10',
			method             : "GET"
		}, function (err, resp, body) {
			var list;

			should.not.exist(err);
			resp.statusCode.should.equal(403);
			var msg = JSON.parse(body);
			msg.error.should.equal(403);
			msg.message.should.equal("no session");
			return done();
		});
	});

	it('create a beneficiary ( must be JSON )', function(done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "POST",
			jar                : sessionCookies[0],
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
			jar                : sessionCookies[0],
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
			jar                : sessionCookies[0],
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
			jar                : sessionCookies[0]
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
			jar                : sessionCookies[0],
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
	
	it('get professionals', function(done) {
		request({url           : domain + '/api/beneficiaries/'+entry1._id+"/professionals",
			method             : "GET",
			jar                : sessionCookies[0]
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			var items = JSON.parse(body);
			items.should.be.a("array");
			items.length.should.equal(0);
			return done();
		});
	});

	it('add a professional', function(done) {
		var professional = { professionalID: "53fb2763b3371800000d42cd", referent: true };
		request({url           : domain + '/api/beneficiaries/'+entry1._id+"/professionals",
			method             : "POST",
			jar                : sessionCookies[0],
			form	           : JSON.stringify(professional)
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			var items = JSON.parse(body);
			items.should.be.a("array");
			items.length.should.equal(1);
			items[0].should.have.property("_id");
			items[0]._id.should.equal(professional.professionalID);
			items[0].should.have.property("name");
			items[0].should.have.property("role");
			items[0].should.have.property("referent");
			items[0].referent.should.equal(true);
			return done();
		});
	});

	it('get beneficiaries (professional)', function (done) {
		request({url           : domain + '/api/beneficiaries',
			method             : "GET",
			jar                : sessionCookies[2]
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
			list.nb.should.be.equal(1);
			list.items.should.have.length(1);

			return done();
		});
	});
	
	it('add a second professional', function(done) {
		var professional = { professionalID: "53fb2763b3371800000d42d1", referent: false };
		request({url           : domain + '/api/beneficiaries/'+entry1._id+"/professionals",
			method             : "POST",
			jar                : sessionCookies[0],
			form	           : JSON.stringify(professional)
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			var items = JSON.parse(body);
			items.should.be.a("array");
			items.length.should.equal(2);
			items[1].should.have.property("_id");
			items[1]._id.should.equal(professional.professionalID);
			items[1].should.have.property("name");
			items[1].should.have.property("role");
			items[1].should.have.property("referent");
			items[1].referent.should.equal(false);
			return done();
		});
	});

	it('delete a professional', function(done) {
		request({
			url   : domain + '/api/beneficiaries/' + entry1._id + "/professionals/53fb2763b3371800000d42cd",
			method: "DELETE",
			jar   : sessionCookies[0]
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			var items = JSON.parse(body);
			items.should.be.a("array");
			items.length.should.equal(1);
			items[0].should.have.property("_id");
			items[0]._id.should.equal("53fb2763b3371800000d42d1");
			return done();
		});
	});
	
	it('delete a beneficiary', function(done) {
		request({url           : domain + '/api/beneficiaries/'+entry1._id,
			method             : "DELETE",
			jar                : sessionCookies[0]
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
			jar   : sessionCookies[0]
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.equal("");
			sessionCookies[0].getCookieString(domain).should.equal("");
			return done();
		});
	});

	after(function () {
		// console.log("recover database");
	});
});