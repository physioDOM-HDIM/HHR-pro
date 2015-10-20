/**
 * @file physicalPlan.js
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

var Promise = require("rsvp").Promise,
	dbPromise = require("./database.js"),
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	Queue = require("./queue.js"),
	moment = require("moment");

var logger = new Logger("PhysicalPlan");

/**
 * Physical Plan constructor
 * 
 * @param beneficiaryID the id of the beneficiary
 */
function PhysicalPlan(beneficiaryID) {
	this.beneficiary = beneficiaryID;
}

/**
 * Get the lists of physical plan items by page
 * 
 * When the promise is fulfilled it returns a list object
 * 
 * @param pg {Number} the page number ( 1 by default )
 * @param offset {Number} number of items per page ( 50 per default )
 * @param sort {String} A field to sort the items
 * @param sortDir {Number} The sorting direction 1 : ascending, -1 : descending
 * @returns {Promise}
 */
PhysicalPlan.prototype.getItems = function( pg, offset, sort, sortDir) {
	logger.trace("getItems");

	pg = pg || 1;
	offset = offset || 50;

	var search = { beneficiary : this.beneficiary };
	var cursor = physioDOM.db.collection("physicalPlan").find(search);
	var cursorSort = {};
	if(sort) {
		cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
	} else {
		cursorSort.datetime = -1;
	}
	cursor = cursor.sort( cursorSort );
	return dbPromise.getList(cursor, pg, offset);
};

/**
 * Get physical advices by page in an array
 * 
 * @param pg
 * @param offset
 * @param sort
 * @param sortDir
 * @returns {*}
 */
PhysicalPlan.prototype.getItemsArray = function( pg, offset, sort, sortDir) {
	logger.trace("getItemsArray");

	pg = pg || 1;
	offset = offset || 50;

	var search = { beneficiary : this.beneficiary };
	var cursor = physioDOM.db.collection("physicalPlan").find( search );
	var cursorSort = {};
	if(sort) {
		cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
	} else {
		cursorSort.datetime = -1;
	}
	cursor = cursor.sort( cursorSort );
	return dbPromise.getArray(cursor, pg, offset);
};

/**
 * Get the last physical advice
 * 
 * @returns {*}
 */
PhysicalPlan.prototype.getLastOne = function() {
	var that = this;
	return new Promise( function(resolve, reject) {
		logger.trace("getLastOne", that.beneficiary);
		var search = { beneficiary: that.beneficiary };

		physioDOM.db.collection("physicalPlan").find(search).sort({datetime:-1}).limit(1).toArray( function (err, doc) {
			if (err) {
				logger.alert("Error");
				throw err;
			}
			if(!doc && doc[0]) {
				reject( {code:404, error:"not found"});
			} else {
				for (var prop in doc[0]) {
					if (doc[0].hasOwnProperty(prop)) {
						that[prop] = doc[0][prop];
					}
				}
				resolve(that);
			}
		});
	});
};

/**
 * Save the new physical advice
 * 
 * when fulfilled the promise return the current object ( saved )
 * 
 * @returns {Promise}
 */
PhysicalPlan.prototype.save = function() {
	var that = this;
	return new Promise( function(resolve, reject) {
		logger.trace("save");
		var search = { beneficiary: that.beneficiary };

		physioDOM.db.collection("physicalPlan").count(search, function (err, count) {
			if (err) {
				throw err;
			}
			physioDOM.db.collection("physicalPlan").save(that, function (err, result) {
				if (err) {
					throw err;
				}
				if (isNaN(result)) {
					that._id = result._id;
				}
				that.pushPhysicalPlanToQueue()
					.then( function() {
						if( count ) { that.count = count; }
						resolve(that);
					})
					.catch( function(err) {
						if(err.stack) {
							console.log( err.stack );
						} else {
							console.log(err);
						}
						reject(err);
					});
			});
		});
	});
};

/**
 * Setup a physical advice
 * 
 * @param beneficiaryID
 * @param physicalPlanObj
 * @param professionalID
 * @returns {Promise}
 */
PhysicalPlan.prototype.setup = function( beneficiaryID, physicalPlanObj, professionalID ) {
	logger.trace("setup");

	for (var prop in physicalPlanObj) {
		if (physicalPlanObj.hasOwnProperty(prop)) {
			this[prop] = physicalPlanObj[prop];
		}
	}

	this.beneficiary = new ObjectID(beneficiaryID);
	this.professional = new ObjectID(professionalID);
	this.datetime = moment().toISOString();

	return this.save();
};

/**
 * Push the physical advices to the queue
 * 
 * if force is set to true, send all items, otherwise send the items not yet sent.
 * 
 * @param force {Boolean}
 * @returns {Promise}
 */
PhysicalPlan.prototype.pushPhysicalPlanToQueue = function (force) {
	logger.trace("pushPhysicalPlanToQueue");

	var queue = new Queue(this.beneficiary);
	var name = "hhr[" + this.beneficiary + "].physical";
	force = force?true:false;

	var search = { 
		beneficiary: this.beneficiary
	};
	if( !force ) {
		search.transmit = { '$exists' : false };
	}
	
	return new Promise( function(resolve, reject) {
		var msgs = [];
		
		var cursor = physioDOM.db.collection("physicalPlan").find(search);
		cursor = cursor.sort({datetime: -1});

		cursor.each(function (err, item) {
			var newItem = false;
			var msg = [];
			var count = 0;
			
			if( err ) {
				logger.alert("error reading database", err);
				reject(err);
			} else {
				if (item === null) {
					if( count ) {
						if (newItem) {
							msg.push({
								name : name + ".new",
								value: 1,
								type : "integer"
							});
						} else {
							msg.push({
								name : name + ".new",
								value: 0,
								type : "integer"
							});
						}
						queue.postMsg(msg);
						msgs.push(msg);
					}
					resolve(msgs);
				} else {
					count++;
					msg.push({
						name : name + ".history[" + item._id + "].datetime",
						value: moment.tz(item.datetime, physioDOM.config.timezone).unix(),
						type : "integer"
					});
					msg.push({
						name : name + ".history[" + item._id + "].description",
						value: item.content,
						type : "string"
					});
					if( !item.transmit ) {
						newItem = true;
						item.transmit = moment().toISOString();
						physioDOM.db.collection("physicalPlan").save( item, function(err, res) { });
					}
					queue.postMsg(msg);
					msgs.push(msg);
				}
			}
		});
	});
};

module.exports = PhysicalPlan;