'use strict';
/* jslint node:true */
/* jshint expr:true */
/* global domain, sessionCookies, describe, it, before, after */

var request = require("request"),
	querystring = require("querystring"),
	moment = require('moment'),
	testCommon = require("./testCommon");

var chai = require("chai");
chai.should();
chai.use(require('chai-things'));

var beneficiaryID, msgs, ids;

describe('Agenda', function () {
	before(function (done) {
		testCommon.login({login: 'fablec', password: 'p4y510D0#'})
			.then(function (cookie) {
				sessionCookies.push(cookie);
				done();
			})
			.catch(function (err) {
				console.error("error login to application");
				throw err;
			});
	});

	it('search for beneficiary "Forest Gump"', function (done) {
		request(
			{
				url   : domain + '/api/beneficiaries?filter={"name":"Gump"}',
				method: "GET",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				var list;

				resp.statusCode.should.equal(200);
				body.should.be.a("string");

				list = JSON.parse(body);
				list.should.be.an('object');
				list.should.have.property("nb");
				list.items.should.be.an("array");
				list.nb.should.be.equal(1);
				list.items.should.have.length(1);
				beneficiaryID = list.items[0]._id;
				
				return done();
			});
	});
	
	it('select beneficiary "Forest Gump"', function(done) {
		request(
			{
				url   : domain + '/api/beneficiaries/'+beneficiaryID+'/select',
				method: "GET",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				var beneficiary;

				resp.statusCode.should.equal(200);
				body.should.be.a("string");

				beneficiary = JSON.parse(body);
				beneficiary.should.be.an('object');
				beneficiary.should.have.property("_id");
				beneficiary._id.should.be.equal(beneficiaryID);
				beneficiary.should.have.property("name");
				beneficiary.name.should.have.property("family");
				beneficiary.name.should.have.property("given");
				beneficiary.name.family.should.be.equal("Gump");
				beneficiary.name.given.should.be.equal("Forrest");
				
				return done();
			});
	});
	
	it('check if beneficiary is well selected', function( done ) {
		request(
			{
				url   : domain + '/api/beneficiary',
				method: "GET",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				var beneficiary;

				resp.statusCode.should.equal(200);
				
				beneficiary = JSON.parse(body);
				beneficiary.should.be.an('object');
				beneficiary.should.have.property("_id");
				beneficiary._id.should.be.equal(beneficiaryID);
				beneficiary.should.have.property("name");
				beneficiary.name.should.have.property("family");
				beneficiary.name.should.have.property("given");
				beneficiary.name.family.should.be.equal("Gump");
				beneficiary.name.given.should.be.equal("Forrest");
				
				return done();
			});
	});

	it('clear agenda', function(done) {
		request(
			{
				url   : domain + '/api/beneficiary/services/queueitems',
				method: "DELETE",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				resp.statusCode.should.equal(200);
				
				return done();
			}
		);
	});
	
	it('get agenda for 2016-02-01', function(done) {
		request(
			{
				url   : domain + '/api/beneficiary/services/queueitems?startDate=2016-02-01',
				method: "GET",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				var agenda, msg;
				
				resp.statusCode.should.equal(200);
				
				agenda = JSON.parse(body);
				agenda.should.be.an('array');
				agenda.should.have.length(10);
				
				agenda[agenda.length-1].should.be.an('array');
				msg = agenda[agenda.length-1][0];
				msg.should.be.an('object');
				msg.should.have.property('name');
				msg.name.should.equal("hhr[559a3edde137390900e529b0].agenda.new");
				msg.should.have.property('value');
				msg.value.should.equal(1);
				
				
				return done();
			}
		);
	});

	it('get agenda for 2016-02-01 : the new flag must not be present', function(done) {
		request(
			{
				url   : domain + '/api/beneficiary/services/queueitems?startDate=2016-02-01',
				method: "GET",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				var agenda, msg;

				resp.statusCode.should.equal(200);

				agenda = JSON.parse(body);
				agenda.should.be.an('array');
				agenda.should.have.length(9);
				agenda[agenda.length-1].should.be.an('array');
				msg = agenda[agenda.length-1];
				msg.should.be.an('array');
				
				var isNew = msg.filter( function(item) { return /\.agenda\.new$/.test(item.name); } );
				var isNew = /\.agenda\.new$/.test(msg[0].name);
				isNew.should.be.false();
				
				return done();
			}
		);
	});

	it('clear agenda', function(done) {
		request(
			{
				url   : domain + '/api/beneficiary/services/queueitems',
				method: "DELETE",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				resp.statusCode.should.equal(200);

				return done();
			}
		);
	});

	it('get agenda for 2016-01-18', function(done) {
		request(
			{
				url   : domain + '/api/beneficiary/services/queueitems?startDate=2016-01-18',
				method: "GET",
				jar   : sessionCookies[0]
			},
			function (err, resp, body) {
				var agenda, msg;

				resp.statusCode.should.equal(200);

				agenda = JSON.parse(body);
				agenda.should.be.an('array');
				agenda.should.have.length(0);
				msgs= [];

				ids = agenda.slice().map( function(item) {
					return item[0].name.match(/agenda\[(.*)\]/)[1];
				});
				
				return done();
			}
		);
	});
	
	(function() {
		var startDate = '2016-01-18';
		var startEvent = '2016-02-08';
		do {
			startDate = moment(startDate,'YYYY-MM-DD').add(1,'d').format('YYYY-MM-DD');
			it('get agenda for '+startDate, function (done) {
				request(
					{
						url   : domain + '/api/beneficiary/services/queueitems?startDate=' + startDate,
						method: "GET",
						jar   : sessionCookies[0]
					},
					function (err, resp, body) {
						var agenda, tmp, isNew;
						var endDate = moment(startDate,"YYYY-MM-DD").add(15,'d').format("YYYY-MM-DD");
						
						
						resp.statusCode.should.equal(200);
						agenda = JSON.parse(body);
						agenda.should.be.an('array');
						console.log('length previous:%d now:%d', msgs.length, agenda.length);
						
						if(startDate < moment(startEvent,'YYYY-MM-DD').subtract(15,'d').format('YYYY-MM-DD')) {
							agenda.should.have.length(0);
							msgs= [];
						} else if(endDate <= "2016-02-20") {
							agenda.should.have.length(msgs.length + 2);
							isNew = /\.agenda\.new$/.test(agenda[agenda.length - 1][0].name);
							isNew.should.be.true();
							tmp = agenda.slice(0,-1);
							msgs = agenda.slice(0, agenda.length - 1);
						} else if( startDate <= '2016-02-20') {
							agenda.should.have.length(msgs.length);
							isNew = /\.agenda\.new$/.test(agenda[agenda.length - 1][0].name);
							isNew.should.be.false();
							tmp = agenda.slice();
							msgs = agenda.slice();
						} else {
							agenda.should.be.an('array');
							agenda.should.have.length(0);
							msgs = agenda.slice();
						}
						
						return done();
					}
				);
			});
		} while(startDate < '2016-02-28');
	})();
	
	['2016-02-02','2016-02-03','2016-02-04','2016-02-05','2016-02-06'].forEach( function( startDate) {
		it('get agenda for '+startDate, function (done) {
			request(
				{
					url   : domain + '/api/beneficiary/services/queueitems?startDate='+startDate,
					method: "GET",
					jar   : sessionCookies[0]
				},
				function (err, resp, body) {
					var agenda, tmp;

					resp.statusCode.should.equal(200);

					agenda = JSON.parse(body);
					agenda.should.be.an('array');
					console.log('length previous:%d now:%d', msgs.length, agenda.length);
					if(moment(startDate,"YYYY-MM-DD").add(15,'d').format("YYYY-MM-DD") <= "2016-02-20") {
						agenda.should.have.length(msgs.length + 2);
						var isNew = /\.agenda\.new$/.test(agenda[agenda.length - 1][0].name);
						isNew.should.be.true();
						tmp = agenda.slice(0,-1);
					} else {
						agenda.should.have.length(msgs.length);
						tmp = agenda.slice();
					}
					msgs.forEach(function (item, indx) {
						agenda.should.include.something.that.deep.equal(item);
					});
					
					tmp = tmp.map( function(item) {
						return item[0].name.match(/agenda\[(.*)\]/)[1];
					});
					console.log("add :",tmp.filter( function(item) { return ids.indexOf(item) === -1; }));
					console.log("remove :",ids.filter( function(item) { return tmp.indexOf(item) === -1; }));
					ids = tmp.slice();
					
					msgs = agenda.slice(0, agenda.length - 1);
					return done();
				}
			);
		});
	});
	
	[ '2016-02-07'].forEach( function( startDate) {
		it('get agenda for '+startDate, function (done) {
			request(
				{
					url   : domain + '/api/beneficiary/services/queueitems?startDate='+startDate,
					method: "GET",
					jar   : sessionCookies[0]
				},
				function (err, resp, body) {
					var agenda, tmp;

					resp.statusCode.should.equal(200);

					agenda = JSON.parse(body);
					agenda.should.be.an('array');
					console.log('length previous:%d now:%d', msgs.length, agenda.length);
					agenda.should.have.length(msgs.length+1);
					// no new Event
					var isNew = /\.agenda\.new$/.test(agenda[agenda.length - 1][0].name);
					isNew.should.be.false();
					
					msgs.forEach(function (item, indx) {
						agenda.should.include.something.that.deep.equal(item);
					});

					tmp = agenda.slice().map( function(item) {
						return item[0].name.match(/agenda\[(.*)\]/)[1];
					});
					console.log("add :",tmp.filter( function(item) { return ids.indexOf(item) === -1; }));
					console.log("remove :",ids.filter( function(item) { return tmp.indexOf(item) === -1; }));
					ids = tmp.slice();
					
					// console.log( ids );
					
					msgs = agenda.slice();
					return done();
				}
			);
		});
	});
	
	['2016-02-08'].forEach( function( startDate) {
		it('get agenda for '+startDate, function (done) {
			request(
				{
					url   : domain + '/api/beneficiary/services/queueitems?startDate='+startDate,
					method: "GET",
					jar   : sessionCookies[0]
				},
				function (err, resp, body) {
					var agenda, tmp;

					resp.statusCode.should.equal(200);

					agenda = JSON.parse(body);
					agenda.should.be.an('array');
					agenda.should.have.length(msgs.length);
					console.log('length previous:%d now:%d', msgs.length, agenda.length);
					
					// no new Event
					var isNew = /\.agenda\.new$/.test(agenda[agenda.length - 1][0].name);
					isNew.should.be.false();
					
					agenda.forEach(function (item) {
						msgs.should.include.something.that.deep.equal(item);
					});

					tmp = agenda.slice().map( function(item) {
						return item[0].name.match(/agenda\[(.*)\]/)[1];
					});
					console.log("add :",tmp.filter( function(item) { return ids.indexOf(item) === -1; }));
					console.log("remove :",ids.filter( function(item) { return tmp.indexOf(item) === -1; }));
					ids = tmp.slice();
					
					
					msgs = agenda.slice();
					return done();
				}
			);
		});
	});
	
	['2016-02-09','2016-02-10','2016-02-11','2016-02-12',
	 '2016-02-13','2016-02-14','2016-02-15', '2016-02-16',
	 '2016-02-17','2016-02-18','2016-02-19', '2016-02-20'].forEach( function( startDate) {
		it('get agenda for '+startDate, function (done) {
			request(
				{
					url   : domain + '/api/beneficiary/services/queueitems?startDate='+startDate,
					method: "GET",
					jar   : sessionCookies[0]
				},
				function (err, resp, body) {
					var agenda, tmp;

					resp.statusCode.should.equal(200);

					agenda = JSON.parse(body);
					agenda.should.be.an('array');
					console.log('length previous:%d now:%d',msgs.length, agenda.length);
					agenda.should.have.length(msgs.length-1);
					agenda.forEach(function (item) {
						msgs.should.include.something.that.deep.equal(item);
					});

					tmp = agenda.slice().map( function(item) {
						return item[0].name.match(/agenda\[(.*)\]/)[1];
					});
					console.log("remove :",ids.filter( function(item) { return tmp.indexOf(item) === -1; }));
					ids = tmp.slice();
					
					msgs = agenda.slice();
					return done();
				}
			);
		});
	});
	
	['2016-02-21','2016-02-22','2016-02-23', '2016-02-24', 
	 '2016-02-25','2016-02-26','2016-02-27', '2016-02-28'].forEach( function( startDate) {
		it('get agenda for '+startDate, function (done) {
			request(
				{
					url   : domain + '/api/beneficiary/services/queueitems?startDate='+startDate,
					method: "GET",
					jar   : sessionCookies[0]
				},
				function (err, resp, body) {
					var agenda;

					resp.statusCode.should.equal(200);

					agenda = JSON.parse(body);
					agenda.should.be.an('array');
					console.log('length previous:%d now:%d', msgs.length, agenda.length);
					agenda.should.have.length(0);
					msgs = [];
					return done();
				}
			);
		});
	});
});