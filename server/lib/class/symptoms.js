/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

/**
 * @file symptoms.js
 * @module Symptoms
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID;

var logger = new Logger("Symptoms");


function Symptoms( beneficiary ) {
	this.beneficiary = beneficiary;
	
	this.getList = function() {
		logger.trace("getList");
		return physioDOM.Lists.getListItemsObj("symptom");
	};
	
	this.getHistoryList = function() {
		logger.trace("getHistoryList");

		var reduceFunction = function ( curr, result ) {
			if( !result.history.length ) {
				result.history.push( { datetime: curr.datetime, value: curr.value} );
			} else {
				var done = false;
				for( var i= 0, l = result.history.length; i < l; i++ ) {
					if ( result.history[i].datetime < curr.datetime ) {
						result.history.splice(i,0, { datetime: curr.datetime, value: curr.value} );
						done = true;
						break;
					}
				}
				if( done === false && result.history.length < 5) {
					result.history.push( { datetime: curr.datetime, value: curr.value} );
				}
				if( result.history.length > 5 ) {
					result.history = result.history.slice(0,5);
				}
			}
		};

		var groupRequest = {
			key    : { text: 1, subject: 1, category:1, automatic:1 },
			cond   : { subject: this.beneficiary._id, category:"symptom" },
			reduce : reduceFunction.toString(),
			initial: { history: [] }
		};
		
		var that = this;
		
		return new promise( function(resolve, reject) {
			that.getList()
				.then(function (symptoms) {
					physioDOM.db.collection("dataRecordItems").group(groupRequest.key, groupRequest.cond, groupRequest.initial, groupRequest.reduce, function (err, results) {
						if (err) {
							throw err;
						} else {
							results.forEach( function( item ) {
								if( symptoms[item.text]) {
									symptoms[item.text].history = item.history;
								}
							});
							resolve(symptoms);
						}
					});
				});
		});
	}
}

module.exports = Symptoms;