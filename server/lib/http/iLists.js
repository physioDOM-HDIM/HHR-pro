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
		physioDOM.Lists.getLists()
			.then( function(lists) {
				res.send(200, lists);
				next();
			});
	},
	
	getList : function( req, res, next) {
		physioDOM.Lists.getList( req.params.listName, req.session.lang )
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
		res.send(501, { code:501, message:"not implemented"} );
		next(false);
	},
	
	translateItem : function( req, res, next ) {
		res.send(501, { code:501, message:"not implemented"});
		next(false);
	}
};

module.exports = ILists;