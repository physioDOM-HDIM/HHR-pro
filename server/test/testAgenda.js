'use strict';
/* jslint node:true */
/* jshint expr:true */
/* global describe, it, before, after */

var request = require("request"),
	should = require('chai').should(),
	querystring = require("querystring"),
	testCommon = require("./testCommon");

var beneficiaryID;

describe('Agenda', function () {
	before(function (done) {
		console.log('beforeAll');
		console.log("domain", domain);

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
	
	
});