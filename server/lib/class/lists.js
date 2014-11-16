/**
 * @file list.js
 * @module List
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	List = require("./list");

var logger = new Logger("Lists");

/**
 * Directory
 *
 * This class allows to manage the professionals directory
 *
 * @constructor
 */
function Lists( ) {
	this.getLists = function(pg, offset) {
		logger.trace("getLists");
		var cursor = physioDOM.db.collection("lists").find({}, {name:1, editable:1});
		var cursorSort = {};
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};
	
	this.getList = function( listName, lang) {
		logger.trace("getList", listName, lang);
		return new promise( function(resolve, reject) {
			var list = new List();
			list.getByName(listName)
				.then(function (list) {
					if (lang) {
						return list.lang(lang);
					} else {
						return list;
					}
				})
				.then( function(list) {
					// logger.debug("list "+listName, list);
					resolve(list);
				})
				.catch( function(err) {
					logger.warning("list "+listName, err);
					reject(err);
				} );
		});
	};
}

module.exports = Lists;