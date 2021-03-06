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
	 * if allData is true, the method resolve with all data of the lists
	 * otherwise return only the name and editable fields of each list.
	 * 
	 * @param pg
	 * @param offset
	 * @param allData
	 * @returns {*}
	 */
	this.getLists = function(pg, offset, allData) {
		logger.trace("getLists");
		var projection = {name:1, editable:1};
		if(allData){
			projection = {};
		}
		var cursor = physioDOM.db.collection("lists").find({}, projection);
		cursor = cursor.sort( {name:1} );
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
					 //logger.debug("list "+listName, list);
					resolve(list);
				})
				.catch( function(err) {
					logger.warning("list "+listName, err);
					reject(err);
				} );
		});
	};

	/**
	 * Get a list given by its name `listName`
	 * 
	 * if lang parameter is given, the promise return the transalated list, else
	 * the promise return the full list object
	 *
	 * return the associative array with ref property as key
	 *
	 * @param listName {string}
	 * @param lang {string}
	 * @returns {promise}
	 */
	this.getListArray = function( listName, lang) {
		logger.trace("getListArray", listName, lang);
		var that = this;
		return new promise( function(resolve, reject) {
			that.getList(listName, lang)
				.then( function(list) {
					var i, key, obj = {};
	 				for(i=0; i<list.items.length; i++){
	 					key = list.items[i].ref;
	 					//If list returned already translated with lang param
	 					if(typeof key === "undefined"){
	 						key = list.items[i].value;
	 					}
	 					obj[key] = list.items[i].label || " ";
	 				}
	 				list.items = obj;
					resolve(list);
				})
				.catch( function(err) {
					logger.warning("list "+listName, err);
					reject(err);
				} );
		});
	};

	this.getListItemsObj = function( listName ) {
		logger.trace("getListItemsObj", listName );
		var that = this;
		var results = {};
		return new promise( function(resolve, reject) {
			that.getList( listName )
				.then( function(list) {
					// logger.debug("list "+listName, list);
					var i, key;
					for(i=0; i< list.items.length; i++){
						key = list.items[i].ref;
						results[key] = list.items[i];
					}
					resolve(results);
				})
				.catch( function(err) {
					logger.warning("list "+listName, err);
					reject(err);
				} );
		});
	};
}

module.exports = Lists;