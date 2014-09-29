var MongoClient = require("mongodb").MongoClient,
	ObjectID = require("mongodb").ObjectID,
	RSVP = require("rsvp"),
	Promise = RSVP.Promise;


module.exports = {
	dbClient: null,
	connect: function( uri ) {
		var promise = new Promise( function(resolve, reject) {
			MongoClient.connect( uri, function(err, dbClient) {
				if(err) { reject( err ); }
				this.dbClient = dbClient;
				resolve(dbClient);
			});
		});
		return promise;
	},
	count: function( cursor ) {
		var promise = new Promise( function(resolve, reject) {
			cursor.count( function(err, count) {
				resolve(count);
			});
		});
		return promise;
	},
	getList: function( cursor, pg, offset) {
		var that = this;
		var promise = new Promise( function(resolve, reject) {
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
		return promise;
	},
	save: function(collection, obj) {
		var that = this;
		var promise = new Promise( function(resolve, reject) {
			
		});
	}
};