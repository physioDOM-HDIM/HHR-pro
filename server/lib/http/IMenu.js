/**
 * @file IMenu.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
'use strict';

var RSVP     = require('rsvp');
var Menu     = require('../class/menu');
var specialRights = require("../class/specialRights");
var ObjectID = require('mongodb').ObjectID;
var Logger   = require('logger');

var logger = new Logger('IMenu');

/**
 * IMenu
 *
 * Manage http request about menus.
 */
var IMenu = {

	/**
	 * Send all the menu.
	 * 
	 * @param  {[type]}   req  [description]
	 * @param  {[type]}   res  [description]
	 * @param  {Function} next [description]
	 * @return {[type]}        [description]
	 */
	getMenu: function(req, res, next) {
		logger.trace('getMenu');

		var that = this;
		
		new Menu().getMenu( req.session.role )
		.then(function(menu) {
				res.send(200, menu);
				next();
			});
	},

	putRights: function(req, res, next) {
		logger.trace('putRights');

		var body = JSON.parse(req.body);

		var role = body.role;
		var rights = body.rights || [];
		var spRights = body.spRights || [];
		
		var promises = rights.map(function(right) {
			return new RSVP.Promise(function(resolve, reject) {
				var id = right.id;

				new Menu().get(new ObjectID(id))
					.then(function(item) {
	
						right[role] = parseInt(right[role]);
	
						if(right[role] !== 1 && right[role] !== 2) {
							right[role] = 0;
						}
	
						item.rights[role] = right[role];
	
						return item.save();
					})
					.then(function(item) {
						resolve(item);
					})
					.catch(function(err) {
						reject();
					});
			});
		});
		
		var spPromises = spRights.map( function(right) {
			return new RSVP.Promise(function(resolve, reject) {
				var label = right.id;

				new specialRights().get(label)
					.then(function (item) {
						right[role] = parseInt(right[role]);

						if (right[role] !== 1 && right[role] !== 2) {
							right[role] = 0;
						}

						item.rights[role] = right[role];

						return item.save();
					})
					.then(resolve)
					.catch(reject);
			});
		});

		RSVP.all(promises)
			.then(function(items) {
				return RSVP.all(spPromises);
			})
			.then(function(items) {
		  		res.send(200);
				next();
			})
			.catch(function(reason) {
				res.send(500);
				next();
			});
	}
};

module.exports = IMenu;