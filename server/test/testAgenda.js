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

var beneficiaryID, msgs;

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
				msgs = agenda;
				msg = agenda[agenda.length-1];
				msg.should.be.an('array');
				var isNew = msg.filter( function(item) { return /\.agenda\.new$/.test(item.name); } );
				var isNew = /\.agenda\.new$/.test(msg[0].name);
				isNew.should.be.false();
				
				return done();
			}
		);
	});
	
	['2016-02-02','2016-02-03','2016-02-04','2016-02-05','2016-02-06', '2016-02-07', '2016-02-08'].forEach( function( startDate) {
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
					if(moment(startDate,"YYYY-MM-DD").add(15,'d').format("YYYY-MM-DD") <= "2016-02-20") {
						agenda.should.have.length(msgs.length + 2);
						var isNew = /\.agenda\.new$/.test(agenda[agenda.length - 1][0].name);
						isNew.should.be.true();
					} else {
						agenda.should.have.length(msgs.length);
					}
					msgs.forEach(function (item, indx) {
						agenda.should.include.something.that.deep.equal(item);
					});
					msgs = agenda.slice(0, agenda.length - 1);
					return done();
				}
			);
		});
	});
});