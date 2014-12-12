/* jshint node:true */
/* global describe, before, it, after */

"use strict";

var request = require("request"),
	should = require('chai').should(),
	expect = require('chai').expect,
	querystring = require("querystring"),
	promise = require("rsvp").Promise,
	testCommon = require("./testCommon");

var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies
var sessionCookies = [];

describe('Lists', function() {

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

	it('get list of lists', function(done) {
		request({
				url   : domain + '/api/lists',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("items");
				list.items.length.should.equal(19);
				
				var count = list.items.length;
				list.items.forEach( function(item, indx) {
					item.should.have.property("_id");
					item.should.have.property("name");
					item.should.have.property("editable");
					if( --count === 0) {
						return done();
					}
				});
			}
		);
	});

	it('get list \'socialServices\'', function(done) {
		request({
				url   : domain + '/api/lists/socialServices',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("editable");
				list.should.have.property("items");
				expect(list.defaultValue).to.be.a('null');
				list.editable.should.equal(false);
				list.items.length.should.equal(7);

				var count = list.items.length;
				list.items.forEach( function(item, indx) {
					item.should.have.property("ref");
					item.should.have.property("label");
					item.label.should.have.property("en");
					item.label.should.have.property("es");
					item.label.should.have.property("nl");
					if( --count === 0) {
						return done();
					}
				});
			}
		);
	});

	it('get list \'socialServices\' in English', function(done) {
		request({
				url   : domain + '/api/lists/socialServices/translate?lang=en',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("items");
				list.items.length.should.equal(7);

				var count = list.items.length;
				list.items.forEach( function(item, indx) {
					item.should.have.property("value");
					item.should.have.property("label");
					if( --count === 0) {
						return done();
					}
				});
			}
		);
	});

	it('get list \'socialServices\' in Spanish', function(done) {
		request({
				url   : domain + '/api/lists/socialServices/translate?lang=es',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("items");
				list.items.length.should.equal(6);

				var count = list.items.length;
				list.items.forEach( function(item, indx) {
					item.should.have.property("value");
					item.should.have.property("label");
					if( --count === 0) {
						return done();
					}
				});
			}
		);
	});

	it('get list \'socialServices\' in italian', function(done) {
		request({
				url   : domain + '/api/lists/socialServices/translate?lang=it',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var error;
				error = JSON.parse(body);
				error.should.have.property("code");
				error.should.have.property("message");
				error.code.should.equal(405);
				error.message.should.eql("unrecognized language");
				resp.statusCode.should.equal(405);
				done();
			}
		);
	});

	it('get list \'job\'', function(done) {
		request({
				url   : domain + '/api/lists/job',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("editable");
				list.should.have.property("items");
				expect(list.defaultValue).to.be.a('null');
				list.editable.should.equal(true);
				list.items.length.should.equal(0);
				return done();
			}
		);
	});

	it('add an item to list \'job\'', function(done) {
		var entry = { "ref":"administrator", "label":{"en":"administrator", "fr":"administrateur" } }
		request({
				url        : domain + '/api/lists/job',
				method     : "POST",
				jar        : sessionCookies[0],
				headers    : { "content-type":"text/plain"},
				body       : JSON.stringify(entry)
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("editable");
				list.should.have.property("items");
				expect(list.defaultValue).to.be.a('null');
				list.editable.should.equal(true);
				list.items.length.should.equal(1);
				list.items[0].active.should.equal(true);
				list.items[0].ref.should.equal("administrator");
				list.items[0].should.have.property("label");
				list.items[0].label.should.have.property("fr");
				list.items[0].label.should.have.property("en");
				return done();
			}
		);
	});

	it('add translation to the item of the list \'job\'', function(done) {
		var entry = {"es":"administrador", "nl":"beheerder" };
		request({
				url        : domain + '/api/lists/job/administrator',
				method     : "PUT",
				jar        : sessionCookies[0],
				headers    : { "content-type":"text/plain"},
				body       : JSON.stringify(entry)
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("editable");
				list.should.have.property("items");
				expect(list.defaultValue).to.be.a('null');
				list.editable.should.equal(true);
				list.items.length.should.equal(1);
				list.items[0].ref.should.equal("administrator");
				list.items[0].should.have.property("label");
				list.items[0].label.should.have.property("fr");
				list.items[0].label.should.have.property("en");
				list.items[0].label.should.have.property("es");
				list.items[0].label.should.have.property("nl");
				return done();
			}
		);
	});

	it('update translation to the item of the list \'job\'', function(done) {
		var entry = {"fr":"Administrateur", "nl":null };
		request({
				url        : domain + '/api/lists/job/administrator',
				method     : "PUT",
				jar        : sessionCookies[0],
				headers    : { "content-type":"text/plain"},
				body       : JSON.stringify(entry)
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("editable");
				list.should.have.property("items");
				expect(list.defaultValue).to.be.a('null');
				list.editable.should.equal(true);
				list.items.length.should.equal(1);
				list.items[0].ref.should.equal("administrator");
				list.items[0].should.have.property("label");
				list.items[0].label.should.have.property("fr");
				list.items[0].label.should.have.property("en");
				list.items[0].label.should.have.property("es");
				list.items[0].label.should.have.property("nl");
				list.items[0].label.fr.should.equal(entry.fr);
				expect(list.items[0].label.nl).to.be.a('null');
				return done();
			}
		);
	});

	it('get list \'job\' in French', function(done) {
		request({
				url   : domain + '/api/lists/job/translate?lang=fr',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("items");
				list.items.length.should.equal(1);
				var item = list.items[0];
				
				item.should.have.property("value");
				item.should.have.property("label");
				item.value.should.equal("administrator");
				item.label.should.equal("Administrateur");
				done();
			}
		);
	});

	it('get list \'job\' in Dutch', function(done) {
		request({
				url   : domain + '/api/lists/job/translate?lang=nl',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("items");
				list.items.length.should.equal(0);
				done();
			}
		);
	});

	it('deactivate item in \'job\' list', function(done) {
		var activate = { active:false };
		request({
				url   : domain + '/api/lists/job/administrator',
				method: "POST",
				jar   : sessionCookies[0],
				headers    : { "content-type":"text/plain"},
				body       : JSON.stringify(activate)
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("items");
				list.items.length.should.equal(1);
				var item = list.items[0];

				item.should.have.property("active");
				item.active.should.equal(false);
				done();
			}
		);
	});

	it('get list \'job\' in French ( dactivate are not sent)', function(done) {
		request({
				url   : domain + '/api/lists/job/translate?lang=fr',
				method: "GET",
				jar   : sessionCookies[0]
			}, function (err, resp, body) {
				var list;
				list = JSON.parse(body);
				list.should.have.property("defaultValue");
				list.should.have.property("items");
				list.items.length.should.equal(0);
				done();
			}
		);
	});
	
	after(function () {
		// console.log("recover database");
	});
});