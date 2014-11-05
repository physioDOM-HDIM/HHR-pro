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
		var list = new List();
		return list.getByName(listName, lang);
	};
}

module.exports = Lists;