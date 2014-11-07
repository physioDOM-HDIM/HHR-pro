/* jslint node:true */
/* global physioDOM */
"use strict";

/**
 * IList
 * 
 * treat http request about lists
 */

var Logger = require("logger");
var logger = new Logger("IList");

var ILists = {
	
	getLists : function( req, res, next) {
		logger.trace("getLists");
		physioDOM.Lists.getLists()
			.then( function(lists) {
				res.send(200, lists);
				next();
			});
	},
	
	getList : function( req, res, next) {
		logger.trace("getList");
		physioDOM.Lists.getList( req.params.listName )
			.then( function(list) {
				res.send(list);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getListTranslate: function(req, res, next ) {
		physioDOM.Lists.getList( req.params.listName )
			.then( function(list) {
				console.log( req.session.lang || req.params.lang );
				return list.lang(req.session.lang || req.params.lang );
			})
			.then( function(list) {
				res.send(list);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	addItem : function( req, res, next) {
		logger.trace("addItem");
		physioDOM.Lists.getList( req.params.listName )
			.then( function(list) {
				try {
					var item = JSON.parse(req.body);
					return list.addItem( item );
				} catch( err ) {
					if( err.code ) {
						throw err;
					} else {
						throw {code: 405, message: "not JSON format"};
					}
				}
			})
			.then( function( list ) {
				res.send(list);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	translateItem : function( req, res, next ) {
		logger.trace("translateItem");
		res.send(501, { code:501, message:"not implemented"});
		next(false);
	}
};

module.exports = ILists;