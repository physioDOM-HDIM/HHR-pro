/**
 * @file message.js
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	dbPromise = require("./database.js"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	messageSchema = require("./../schema/messageSchema"),
	moment = require("moment");

var logger = new Logger("Messages");

/**
 * Manage a message to home for the given beneficiary
 *
 * @constructor
 */
function Messages( beneficiaryID ) {
	this.subject = beneficiaryID;

	/**
	 * Create a new messages
	 *
	 * @param professionalID {object} identifier of the professional that post the message
	 * @param msg {object} 
	 * @returns {promise}
	 */
	this.create = function( session, msg ) {
		var that = this;
		
		return new promise( function(resolve, reject) {
			logger.trace("setup");
			that.checkSchema( msg, session )
				.then(function (msg) {
					for (var key in msg) {
						if (msg.hasOwnProperty(key)) {
							if( key === "author" ) {
								that.author = new ObjectID(msg.author);
							} else {
								that[key] = msg[key];
							}
						}
					}
					that.datetime = moment.utc().toISOString();
					that.status = "transmitting";
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	/**
	 * Check if the message complies
	 * 
	 * @param msg {object}
	 * @param session {object}
	 */
	this.checkSchema = function( msg, session ) {
		var that = this;
		
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = messageSchema.validator.validate( msg, { "$ref":"/Message"} );
			if( check.errors.length ) {
				return reject( { error:"bad format", detail: check.errors } );
			} else {
				if( session.person.id.toString() === msg.author ) {
					resolve(msg);
				} else {
					if( ["administrator","coordinator"].indexOf(session.role) !== -1) {
						physioDOM.Beneficiaries()
							.then(function (beneficiaries) {
								console.log( "beneficiary ", that.subject );
								return beneficiaries.getBeneficiaryByID( session, that.subject.toString() );
							})
							.then( function(beneficiary) {
								return beneficiary.hasProfessional( new ObjectID(msg.author));
							})
							.then( function( hasProfessional ) {
								console.log("professionals", hasProfessional );
								if( hasProfessional ) {
									resolve(msg);
								} else {
									reject({code:403, message:"you can't post a message with this author"} )
								}
								
							})
							.catch( reject );
					} else {
						reject({code:403, message:"you are not authorize to post a message for this beneficiary"});
					}
				}
				
				// check if the professional is one of attached to the beneficiary
				// or if it's admin or coordinator
			}
		});
	};
	
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save" );

			physioDOM.db.collection("messages").save( that, function(err, result) {
				if(err) {
					throw err;
				}
				if( isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};

	/**
	 * Get the list of message per page
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param sortDir
	 * @param filter
	 * @returns {*}
	 */
	this.list = function( pg, offset, sort, sortDir, filter ) {
		logger.trace("list");
		var Directory;
		var that = this;
		
		if(!pg) { pg = 0; }
		if(!offset) { offset=25; }

		return new promise( function(resolve, reject) {
			var search = { subject: that.subject };
			
			if(filter) {
				console.log("filter", filter);
				try {
					var tmp  = JSON.parse(filter);
					for( var prop in tmp) {
						if(tmp.hasOwnProperty(prop)) {
							console.log("prop",prop);
							switch(prop) {
								case "sender":
									search.author = new ObjectID(tmp.sender);
									break;
								case "status":
									search.status = tmp.status;
									break;
								case "startDate":
									search.datetime = { '$gte': tmp.startDate+"T00:00.000Z"};
									break;
								case "stopDate":
									if( search.datetime ) {
										search.datetime['$lte'] = tmp.stopDate+"T23:59.000Z";
									} else {
										search.datetime = {'$lte': tmp.stopDate + "T23:59.000Z"};
									}
									break;
							}
						}
					}
				} catch(err) {
					search = { subject: that.subject };
				}
			}
			 
			// logger.debug("search filter", search);
			var cursor = physioDOM.db.collection("messages").find(search);
			var cursorSort = {};
			if(sort) {
				cursorSort[sort] = [-1,1].indexOf(sortDir)!==-1?sortDir:1;
			} else {
				cursorSort.datetime = -1;
			}
			cursor = cursor.sort( cursorSort );
			
			function replaceAuthor( item ) {
				return new promise(function (resolve, reject) {
					Directory.getEntryByID(item.author)
						.then(function (professional) {
							item.author = { 
								id: item.author,
								name: professional.name
							};
							resolve(item);
						});
				});
			}
			
			physioDOM.Directory()
				.then( function (directory) {
					Directory = directory;
					return dbPromise.getList(cursor, pg, offset);
				})
				.then( function( list ) {
					RSVP.all( list.items.map( replaceAuthor ))
						.then(function( result ) {
							list.items = result;
							resolve( list );
						});
				});
		});
	};
}

module.exports = Messages;