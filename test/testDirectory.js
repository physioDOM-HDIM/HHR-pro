/* jslint node:true */
/* global describe, it, before, after */
"use strict";

var request = require("request"),
	should = require('chai').should(),
	querystring = require("querystring"),
	Promise = require("rsvp").Promise,
	testCommon = require("./testCommon");

var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies
var sessionCookie = request.jar();

var entry1, entry2;   // entries created during tests

describe('Directory', function() {

	before(function ( done ) {
		testCommon.before()
			.then( function() {
				done();
			})
			.catch( function(err) {
				console.error("error when initializing the database");
				throw err;
			});
	});
	
	it('login by header', function(done) {
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
	
	it('login by POST', function(done) {
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
	
	it('get directory', function(done) {
		request({url           : domain + '/api/directory',
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
			list.nb.should.be.equal(27);
			list.items.should.have.length(10);
			
			return done();
		});
	});

	it('create a new entry directory (professional)', function(done) {
		var newEntry = {
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
			role:"physician",
			active:false
		};
		request({url           : domain + '/api/directory',
				method             : "POST",
				jar                : sessionCookie,
				form	           : JSON.stringify(newEntry)
			}, function (err, resp, body) {
					var item;
					should.not.exist(err);
					resp.statusCode.should.equal(200);
					body.should.be.a("string");
					try {
						item = JSON.parse(body);
						
					} catch(err) {
						throw {err:"bad json format"};
						return done();
					}
					finally {
						item.should.have.property("_id");
						for( var key in newEntry) {
							if(newEntry.hasOwnProperty(key)) {
								item.should.have.property(key);
								item[key].should.be.eql(newEntry[key]);
							}
						}
						entry1 = item;
						return done();
					}
			});
	});

	it('duplicate error (professional)', function(done) {
		var newEntry = {
			name: {
				family:"Curie",
				given:"Marie"
			},
			gender:"F",
			telecom: [
				{
					system:"email",
					value:"albert.einstein@physiodom.loc"
				},{
					system:"phone",
					value:"025558888"
				}
			],
			role:"physician",
			active:false
		};
		request({url           : domain + '/api/directory',
			method             : "POST",
			jar                : sessionCookie,
			form	           : JSON.stringify(newEntry)
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

	it('create a new bad entry with same email (professional)', function(done) {
		var newEntry = {
			name: "Einstein",
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
			role:"physician"
		};
		request({url           : domain + '/api/directory',
			method             : "POST",
			jar                : sessionCookie,
			form	           : JSON.stringify(newEntry)
		}, function (err, resp, body) {
			var error;
			should.not.exist(err);
			resp.statusCode.should.equal(400);
			error = JSON.parse(body);
			error.should.have.property("error");
			error.error.should.equal("bad format");
			return done();
		});
	});
	
	it('create a new entry directory (organization)', function(done) {
		var newEntry = {
			name: { family: "Hospital CST" },
			organization:true,
			telecom: [
				{
					system:"email",
					value:"hosp.cst@physiodom.loc"
				},{
					system:"phone",
					value:"025558888"
				}
			],
			role:"physician",
			active:true
		};
		request({url           : domain + '/api/directory',
			method             : "POST",
			jar                : sessionCookie,
			form	           : JSON.stringify(newEntry)
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			body.should.be.a("string");
			try {
				item = JSON.parse(body);
			} catch(err) {
				throw {err:"bad json format"};
				return done();
			}
			finally {
				item.should.have.property("_id");
				for( var key in newEntry) {
					if(newEntry.hasOwnProperty(key)) {
						item.should.have.property(key);
						item[key].should.be.eql(newEntry[key]);
					}
				}
				entry2 = item;
				return done();
			}
		});
	});
	
	it('update an entry (professional)', function(done) {
		entry1.communication = "en";
		
		request({url           : domain + '/api/directory/'+entry1._id,
			method             : "PUT",
			jar                : sessionCookie,
			headers            : { "content-type":"text/plain"},
			body               : JSON.stringify(entry1)
		}, function (err, resp, body) {
			var item;
			// console.log(body);
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			item = JSON.parse(body);
			return done();
		});
	});
	
	it('update an entry (organization)', function(done) {
		entry2.communication = "en";
		entry2.active = true;
		
		request({
			url      : domain + '/api/directory/'+entry2._id,
			method   : "PUT",
			jar      : sessionCookie,
			headers  : { "content-type":"text/plain"},
			body     : JSON.stringify(entry2)
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			item = JSON.parse(body);
			return done();
		});
	});
	
	it('add login information to a professional account', function(done) {
		var account = { login:"einstein", password:"e=mc2"};
		request({
			url      : domain + '/api/directory/'+entry1._id+'/account',
			method   : "POST",
			jar      : sessionCookie,
			headers  : { "content-type":"text/plain"},
			body     : JSON.stringify(account)
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			item = JSON.parse(body);
			item.should.have.property("account");
			return done();
		});
	});
	
	it('get account information from a professional', function(done) {
		request({
			url      : domain + '/api/directory/'+entry1._id+'/account',
			method   : "GET",
			jar      : sessionCookie
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			item = JSON.parse(body);
			item.should.have.property("login");
			item.should.have.property("password");
			item.should.have.property("active");
			item.active.should.be.a("boolean");
			item.active.should.equal(entry1.active);
			item.should.have.property("role");
			item.role.should.equal(entry1.role);
			item.should.have.property('person');
			item.person.should.have.property('id');
			item.person.id.should.be.equal(entry1._id);
			item.person.should.have.property('collection');
			item.person.collection.should.be.equal('professionals');
			return done();
		});
	});

	it('cant\'t login if active is false', function(done) {
		var tmpCookie = request.jar();
		request({url           : domain + '/api/login',
			method             : "POST",
			auth               : {username: 'einstein', password: 'e=mc2'},
			jar                : tmpCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(403);
			var cookies = querystring.parse(tmpCookie.getCookieString(domain), ";");
			cookies.should.not.have.property("sessionID");
			return done();
		});
	});

	it('activate a professional should activate the account', function(done) {
		entry1.active = true;

		function updateEntry(entry) {
			return new Promise( function( resolve, reject) {
				request({url           : domain + '/api/directory/'+entry._id,
					method             : "PUT",
					jar                : sessionCookie,
					headers            : { "content-type":"text/plain"},
					body               : JSON.stringify(entry)
				}, function (err, resp, body) {
					var item;
					should.not.exist(err);
					resp.statusCode.should.equal(200);
					item = JSON.parse(body);
					item.should.have.property("active");
					item.active.should.equal(true);
					resolve();
				});
			});
		}
		
		updateEntry(entry1)
			.then( function(professional) {
				request({url           : domain + '/api/directory/'+entry1._id+"/account",
					method             : "GET",
					jar                : sessionCookie,
					headers            : { "content-type":"text/plain"}
				}, function (err, resp, body) {
					var item;
					should.not.exist(err);
					resp.statusCode.should.equal(200);
					item = JSON.parse(body);
					item.should.have.property("active");
					item.active.should.equal(true);
					return done();
				});
			});
	});

	it('cant login with the activated coount', function(done) {
		var tmpCookie = request.jar();
		request({url           : domain + '/api/login',
			method             : "POST",
			auth               : {username: 'einstein', password: 'e=mc2'},
			jar                : tmpCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			var cookies = querystring.parse(tmpCookie.getCookieString(domain), ";");
			cookies.should.have.property("sessionID");
			return done();
		});
	});
	
	it('delete an entry', function(done) {
		request({url           : domain + '/api/directory/'+entry1._id,
			method             : "DELETE",
			jar                : sessionCookie
		}, function (err, resp, body) {
			should.not.exist(err);
			resp.statusCode.should.equal(410);
			return done();
		});
	});
	
	it('logout', function(done) {
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
	});

	after(function () {
		console.log("recover database");
	});
});