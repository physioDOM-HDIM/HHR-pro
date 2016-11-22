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