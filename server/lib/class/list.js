/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	listSchema = require("./../schema/listSchema");

var logger = new Logger("List");

function List() {
	
	this.getByName = function( listName, lang ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getByName", listName);
			physioDOM.db.collection("lists").findOne({ name: listName }, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"not found"});
				} else {
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					resolve(that);
				}
			});
		});
	};
}

module.exports = List;