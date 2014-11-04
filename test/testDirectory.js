/* jshint node:true */

"use strict";

var request = require("request"),
	should = require('chai').should(),
	querystring = require("querystring"),
	promise = require("rsvp").Promise,
	testCommon = require("./testCommon");

var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies
var sessionCookie = request.jar();

var entry1, entry2;   // entries created during tests
var list1; 

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
			var message = JSON.parse(body);
			message.code.should.equal(200);
			message.message.should.equal("logged");
			var cookies = querystring.parse(cookie.getCookieString(domain), "; ");
			Object.keys(cookies).length.should.equal(2);
			cookies.should.have.property("sessionID");
			cookies.should.have.property("role");
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
			var message = JSON.parse(body);
			message.code.should.equal(200);
			message.message.should.equal("logged");
			var cookies = querystring.parse(sessionCookie.getCookieString(domain), ";");
			cookies.should.have.property("sessionID");
			cookies = sessionCookie.getCookies(domain);
			cookies.should.have.length(2);
			var count = cookies.length;
			cookies.forEach( function( cookie ) {
				cookie.should.have.property("httpOnly");
				if( cookie.key === "sessionID") {
					cookie.httpOnly.should.be.true;
				} else {
					cookie.httpOnly.should.be.false;
				}
				cookie.should.have.property("hostOnly");
				cookie.hostOnly.should.be.true;
				cookie.should.have.property("path");
				cookie.path.should.equal("/");
				if( --count === 0 ) {
					return done();
				}
			});
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
			
			// check that entries are arranged by family name
			for( var i=1; i< list.items.length; i++ ) {
				list.items[i].name.family.should.be.above(list.items[i-1].name.family);
			}
			return done();
		});
	});

	it('get directory filter name.family = "a"', function(done) {
		request({
			url           : domain + '/api/directory?filter={"name.family":"a"}',
			method        : "GET",
			jar           : sessionCookie
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
			list.nb.should.be.equal(3);
			list.items.should.have.length(3);

			return done();
		});
	});

	it('get directory filter name.family = "a" and sort by role', function(done) {
		request({
			url           : domain + '/api/directory?filter={"name.family":"a"}&sort=role',
			method        : "GET",
			jar           : sessionCookie
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
			list.nb.should.be.equal(3);
			list.items.should.have.length(3);
			list1 = list;
			return done();
		});
	});

	it('get directory filter name.family = "a" and sort descending by role', function(done) {
		request({
			url           : domain + '/api/directory?filter={"name.family":"a"}&sort=role&dir=-1',
			method        : "GET",
			jar           : sessionCookie
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
			list.nb.should.be.equal(3);
			list.items.should.have.length(3);
			
			list.items.forEach( function(item, indx) {
				item.should.eql( list1.items[2-indx]);
				if(indx === 2 ) { 
					return done(); 
				}
			});
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
						item.should.have.property("_id");
						for( var key in newEntry) {
							if(newEntry.hasOwnProperty(key)) {
								item.should.have.property(key);
								item[key].should.be.eql(newEntry[key]);
							}
						}
						entry1 = item;
						return done();
					} catch(err) {
						throw {err: "bad json format"};
						// return done();
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
				item.should.have.property("_id");
				for( var key in newEntry) {
					if(newEntry.hasOwnProperty(key)) {
						item.should.have.property(key);
						item[key].should.be.eql(newEntry[key]);
					}
				}
				entry2 = item;
				return done();
			} catch(err) {
				throw {err:"bad json format"};
				// return done();
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
	
	it('try to activate a professional without account', function(done) {
		entry1.active = true;
		request({url           : domain + '/api/directory/'+entry1._id,
			method             : "PUT",
			jar                : sessionCookie,
			headers            : { "content-type":"text/plain"},
			body               : JSON.stringify(entry1)
		}, function (err, resp, body) {
			var item;
			should.not.exist(err);
			resp.statusCode.should.equal(200);
			item = JSON.parse(body);
			item.active.should.be.equal(false);
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
			item.active.should.equal(true);
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

	it('cant login with the activated account', function(done) {
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

	it('deactivate a professional should also deactivate the account', function(done) {
		entry1.active = false;

		function updateEntry(entry) {
			return new promise( function( resolve, reject) {
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
					item.active.should.equal(false);
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
					item.active.should.equal(false);
					return done();
				});
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
		// console.log("recover database");
	});
});