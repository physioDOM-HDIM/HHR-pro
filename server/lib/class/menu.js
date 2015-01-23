/**
 * @file menu.js
 * @module Menu
 */

/* jslint node:true */
/* global physioDOM */
'use strict';

var RSVP       = require('rsvp');
var Logger     = require('logger');
var ObjectID   = require('mongodb').ObjectID;
var database   = require("./database.js");
var MenuSchema = require("../schema/menuSchema");

var logger = new Logger('Menu');

/**
 * Manage a menu record.
 * 
 * @constructor
 */
function Menu() {

	/**
	 * Get a menu item.
	 * 
	 * On success the promise returns the menu,
	 * else return a 404 error.
	 * 
	 * @param menuID        ID of the menu
	 * @returns {Promise}
	 */
	this.get = function(id) {

		var that = this;
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('get', id);

			physioDOM.db.collection('menus').findOne({_id:  id}, function (err, doc) {
				if (err) {
					logger.alert('Database error');
					throw err;
				}
				if (!doc) {
					logger.trace('Not found', id);
					reject({code: 404, error: 'Not found'});
				}
				else {
					logger.trace('Found', doc);
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
	
	/**
	 * Get the list of all menus.
	 */
	this.getAll = function() {
		logger.trace('getAll');
		
		function getMenu( menu, parent ) {
			return new RSVP.Promise( function( resolve, reject ) {
				var cursor = physioDOM.db.collection("menus").find( { parent: parent }).sort({index:1});
				database.getArray(cursor)
					.then( function(items) {
						var count = items.length;
						menu = items;
						menu.forEach( function(item, i) {
							if( item.type === "submenu" ) {
								getMenu( [], item._id )
									.then( function( submenu ) {
										items[i].items = submenu;
										if( --count === 0 ) { resolve(menu); }
									});
							} else {
								if( --count === 0 ) { resolve(menu); }
							}
						});
					});
			});
		}
		
		return getMenu( [], null );
	};
	
	this.getMenu = function( role ) {
		logger.trace('getMenu', role);
		
		function getRightMenu( menu, parent ) {
			return new RSVP.Promise( function( resolve, reject ) {
				var search = { parent: parent };
				if( role ) { 
					search['rights.'+role] = { '$gt':0 };
				}
				logger.debug( 'search', search );
				var cursor = physioDOM.db.collection("menus").find( search ).sort({index:1});
				database.getArray(cursor)
					.then( function(items) {
						var count = items.length;
						menu = items;
						logger.debug("count", count );
						if( count === 0 ) {
							resolve(menu);
						} else {
							menu.forEach(function (item, i) {
								if (item.type === "submenu") {
									getRightMenu([], item._id)
										.then(function (submenu) {
											items[i].items = submenu;
											if (--count === 0) {
												resolve(menu);
											}
										});
								} else {
									if (--count === 0) {
										resolve(menu);
									}
								}
							});
						}
					});
			});
		}

		return getRightMenu( [], null );
	};
	
	/**
	 * Save the menu item in the database.
	 * 
	 * @returns {Promise} Promise with the saved object
	 */
	this.save = function() {

		var that = this;
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('save');

			physioDOM.db.collection('menus').save(that, function(err, result) {
				if (err) { 
					throw err; 
				}
				if (isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};

	/**
	 * Check the schema of a menu item
	 * 
	 * @param entry
	 * @returns {Promise}
	 */
	function checkSchema(entry) {
		return new Promise( function(resolve, reject) {
			logger.trace('checkSchema');
			var check = MenuSchema.validator.validate(entry, {'$ref': '/Menu'});
			if (check.errors.length) {
				return reject({error: 'Bad format', detail: check.errors});
			}
			else {
				return resolve(entry);
			}
		});
	}

	/**
	 * Update the menu
	 * 
	 * `updatedEntry` is a full object that replace the old one
	 * 
	 * @param updatedEntry
	 * @returns {Promise}
	 */
	this.update = function(updatedEntry) {

		var that = this;
		return new Promise( function(resolve, reject) {
			logger.trace('update', updatedEntry);
			if (that._id && that._id !== updatedEntry._id) {
				logger.warning('Not same menu');
				throw {code: 405, message: 'Not same menu'};
			}
			updatedEntry._id = that._id;
			checkSchema(updatedEntry)
				.then(function (updatedEntry) {
					logger.debug('Schema is valid');
					for (var key in updatedEntry) {
						if (key !== '_id' && updatedEntry.hasOwnProperty(key)) {
							that[key] = updatedEntry[key];
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	this.rights = function(role, url) {
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('rights', role, url);

			physioDOM.db.collection('menus').findOne({link: url}, function (err, doc) {
				if (err) {
					logger.alert('Database error');
					reject(err);
				}
				if ( doc && doc.rights[role] ) {
					resolve( { 
						read:  (doc.rights[role] > 0),
						write: (doc.rights[role] === 2),
						url: url
					});
				}
				else {
					resolve(
						{ read:false, write:false, url: url }
					);
				}
			});
		});
	};
	
	this.canRead = function(role, url) {
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('canRead', role, url);

			physioDOM.db.collection('menus').findOne({link: url}, function (err, doc) {
				if (err) {
					logger.alert('Database error');
					reject(err);
				}
				if (doc && doc.rights[role] && doc.rights[role] > 0) {
					resolve(true);
				}
				else {
					resolve(false);
				}
			});
		});
	};

	this.canWrite = function(role, url) {
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('canWrite', role, url);

			physioDOM.db.collection('menus').findOne({link: url}, function (err, doc) {
				if (err) {
					logger.alert('Database error');
					reject(err);
				}
				if (doc && doc.rights[role] && doc.rights[role] === 2) {
					resolve(true);
				}
				else {
					resolve(false);
				}
			});
		});
	};
}

module.exports = Menu;