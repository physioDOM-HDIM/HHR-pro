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
 * @file menu.js
 * @module Menu
 */

/* jslint node:true */
/* global physioDOM */
'use strict';

var RSVP       = require('rsvp');
var Promise    = RSVP.Promise;
var Logger     = require('logger');
var ObjectID   = require('mongodb').ObjectID;
var database   = require("./database.js");

var logger = new Logger('Specialrights');

/**
 * Manage a special right record.
 *
 * @constructor
 */
function SpecialRights() {

	/**
	 * Get a special right item given by it's name.
	 *
	 * On success the promise returns the menu,
	 * else return a 404 error.
	 *
	 * @param label {string}        label of the special right
	 * @returns {Promise}
	 */
	this.get = function(label) {

		var that = this;
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('get', label);

			physioDOM.db.collection('specialRights').findOne({ label: label }, function (err, doc) {
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
	 * Get the list of all special rights.
	 */
	this.getAll = function() {
		logger.trace('getAll');

		return new RSVP.Promise( function( resolve, reject ) {
			var cursor = physioDOM.db.collection("specialRights").find( );
			database.getArray(cursor)
				.then( function(items) {
					resolve(items);
				});
		});
	};

	this.getSpRights = function( role ) {
		logger.trace('getSpRights', role);
		
		return new RSVP.Promise( function( resolve, reject ) {
			var search = { parent: parent };
			if( role ) {
				search['rights.'+role] = { '$gt':0 };
			}
			var cursor = physioDOM.db.collection("specialRights").find( search );
			database.getArray(cursor)
				.then( resolve );
		});
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

			physioDOM.db.collection('specialRights').save(that, function(err, result) {
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
				logger.warning('Not same specialRights');
				throw {code: 405, message: 'Not same specialRights'};
			}
			updatedEntry._id = that._id;
			for (var key in updatedEntry) {
				if (key !== '_id' && updatedEntry.hasOwnProperty(key)) {
					that[key] = updatedEntry[key];
				}
			}
			that.save()
				.then(resolve)
				.catch(reject);
		});
	};

	this.rights = function(role, label) {
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('specialRights', role, label);
			
			physioDOM.db.collection('specialRights').findOne( {label: label}, function (err, doc) {
				if (err) {
					logger.alert('Database error');
					reject(err);
				}
				if ( doc && doc.rights[role] ) {
					console.log( "return special rights ");
					resolve( {
						read:  (doc.rights[role] > 0),
						write: (doc.rights[role] === 2),
						label: label
					});
				} else {
					console.log( "return false ");
					resolve( { 
						read:false, 
						write:false, 
						label: label 
					});
				}
			});
		});
	};

	this.canRead = function(role, label) {
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('canRead', role, label);

			physioDOM.db.collection('specialRights').findOne({label: label}, function (err, doc) {
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

	this.canWrite = function(role, label) {
		return new RSVP.Promise(function(resolve, reject) {
			logger.trace('canWrite', role, label);

			physioDOM.db.collection('specialRights').findOne({label: label}, function (err, doc) {
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

module.exports = SpecialRights;