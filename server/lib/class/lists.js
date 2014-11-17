/**
 * @file lists.js
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
 * Lists
 *
 * This class allows to manage lists
 *
 * @constructor
 */
function Lists( ) {
	/**
	 * Get a list of all lists managed in the database
	 * 
	 * @param pg
	 * @param offset
	 * @returns {*}
	 */
	this.getLists = function(pg, offset) {
		logger.trace("getLists");
		var cursor = physioDOM.db.collection("lists").find({}, {name:1, editable:1});
		var cursorSort = {};
		cursor = cursor.sort( cursorSort );
		return dbPromise.getList(cursor, pg, offset);
	};

	/**
	 * Get a list given by its name `listName`
	 * 
	 * if lang parameter is given, the promise return the transalated list, else
	 * the promise return the full list object
	 *
	 * @param listName {string}
	 * @param lang {string}
	 * @returns {promise}
	 */
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