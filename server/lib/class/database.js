/* jslint node:true */
"use strict";

var MongoClient = require("mongodb").MongoClient,
	promise = require("rsvp").Promise;


module.exports = {
	dbClient: null,
	connect: function( uri ) {
		return new promise( function(resolve, reject) {
			MongoClient.connect( uri, function(err, dbClient) {
				if(err) { reject( err ); }
				this.dbClient = dbClient;
				resolve(dbClient);
			});
		});
	},
	
	count: function( cursor ) {
		return new promise( function(resolve, reject) {
			cursor.count( function(err, count) {
				resolve(count);
			});
		});
	},
	
	getList: function( cursor, pg, offset) {
		var that = this;
		return new promise( function(resolve, reject) {
			that.count(cursor)
				.then( function(nb) {
					var list  = { nb: nb, pg: pg || 1, offset:offset || 20, items:[] };
					cursor.skip( (list.pg - 1) * list.offset).limit( list.offset ).toArray( function(err, results) {
						if(err) { reject(err); }
						list.items = results;
						resolve( list );
					});
				});
		});
	}
	
	/*
	save: function(collection, obj) {
		var that = this;
		return new promise( function(resolve, reject) {
			
		});
	}
	*/
};