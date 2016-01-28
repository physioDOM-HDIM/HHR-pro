/**
 * @file specificData.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	promise = RSVP.Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	moment = require("moment");

var logger = new Logger("specificData");

/**
 * Manage a message to home for the given beneficiary
 *
 * @constructor
 */
function SpecificData(beneficiaryID) {
	/**
	 * the beneficiary ID
	 */
	this.subject = beneficiaryID;

	this.getDataSummary = function () {
		logger.trace('getDataSummary');
		var that = this;
		return new promise(function (resolve) {
			RSVP.all([that.getCounts(), that.getHospDays()])
				.then(function (res) {
					var obj = res[1];
					obj.total = res[0];
					resolve(obj);
				});
		});
	};

	this.getCounts = function () {
		logger.trace('getCounts', this.subject);
		var that = this;
		return new promise(function (resolve) {
			physioDOM.db.collection("specificData").group(
				{'event.type': 1},
				{'event.type': {$ne: 'HOSP_EXIT'}, subject: that.subject},
				{total: 0},
				"function ( curr, result ) { result.total++; }",
				function (err, results) {
					var ret = {};
					results.forEach(function (item) {
						var label = item['event.type'] !== "HOSP_ENTRY" ? item['event.type'] : "HOSP";
						ret[label] = item.total;
					});
					resolve(ret);
				});
		});
	};

	this.getHospDays = function () {
		logger.trace('getHospDays');
		var search = {'event.type': /^HOSP_/, subject: this.subject};
		return new promise(function (resolve) {
			physioDOM.db.collection("specificData")
				.find(search)
				.sort({'event.date': 1})
				.toArray(function (err, results) {
					logger.debug(results.length);
					var i, item, days = 0, startDate = "", pending = false;
					for (i = 0; i < results.length; i++) {
						item = results[i].event;
						if (item.type === "HOSP_ENTRY") {
							startDate = moment(item.date);
						} else {
							days += moment(item.date).diff(startDate, "days");
							startDate = "";
						}
					}
					if (startDate) {
						days += moment().diff(startDate, "days");
						pending = true;
					}
					resolve({days: days, pending: pending});
				});
		});
	};

	this.getData = function () {
		logger.trace('getData');
		var that = this;
		return new promise(function (resolve) {
			physioDOM.db.collection("specificData")
				.find({subject: that.subject})
				.sort({'event.date': -1})
				.toArray(function (err, results) {
					resolve(results);
				});
		});
	};

	this.setData = function (obj, professional) {
		logger.trace('setData');
		var event = JSON.parse(obj);
		event.source = professional;
		event.subject = this.subject;

		return new promise(function (resolve) {
			physioDOM.db.collection("specificData")
				.save(event, function (err, result) {
					if (err) {
						throw err;
					}
					resolve(result);
				});
		});
	};
}

module.exports = SpecificData;