var dbPromise = require("../lib/database.js"),
	RSVP = require("rsvp"),
	Promise = RSVP.Promise;

function PhysioDOM( ) {
	var db = null;
	
	this.connect = function(uri) {
		var that = this;
		var promise = new Promise( function(resolve, reject) {
			dbPromise.connect(uri)
				.then( function(dbClient) {
					db = dbClient;
					resolve(that);
				});
			});
		return promise;
	}
	
	this.close = function() {
		db.close();
	}
	
	this.getBeneficiaries = function( pg, offset ) {
		var cursor = db.collection("beneficiaries").find();
	
		return dbPromise.getList(cursor, pg, offset);
	}
	
	this.createBeneficiary = function( obj ) {
		
	}
	
	
	
	this.getDirectory = function( pg, offset, sort, filter) {
		var cursor = db.collection("practitioner").find();
		if(sort) {
			var cursorSort = {};
			cursorSort[sort] = 1
			cursor = cursor.sort( cursorSort );
		}
		return dbPromise.getList(cursor, pg, offset);
	}
}

module.exports = PhysioDOM;