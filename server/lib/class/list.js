/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	listSchema = require("./../schema/listSchema");

var logger = new Logger("List");

function List() {
	
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("save");
			physioDOM.db.collection("lists").save( that, function(err, result) {
				if(err) { throw err; }
				if( isNaN(result)) {
					that._id = result._id;
				}
				resolve(that);
			});
		});
	};
	
	this.getByName = function( listName ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getByName", listName);
			physioDOM.db.collection("lists").findOne({ name: listName }, function (err, doc) {
				if (err) {
					logger.alert("Database Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"not found"});
				} else {
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
	
	this.lang = function( lang ) {
		var that = this;
		return new promise( function( resolve, reject ) {
			if( !lang || physioDOM.lang.indexOf(lang) === -1 ) {
				reject( { code:405, message:"unrecognized language"});
			}
			var options = [];
			that.items.forEach( function(listItem) {
				if( listItem.label[lang] ) {
					options.push({value: listItem.ref, label: listItem.label[lang]});
				}
			});
			resolve( options );
		});
	};
	
	this.addItem = function( item ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("addItem", that.name);
			if( that.editable === false ) {
				return reject( {code:405, message:"list not editable"});
			}
			var check = listSchema.validate( item, { "$ref":'/ListItem' } );
			if( check.errors.length ) {
				reject( { code:405, message:"bad format", detail: check.errors });
			} else {
				var indx = -1;
				that.items.forEach( function(listItem , i) {
					if( listItem.ref === item.ref ) {
						indx = i;
					}
				});
				if( indx !== -1) {
					that.items[indx] = item;
				} else {
					that.items.push( item );
				}
				resolve( that );
			}
			return that.save();
		});
	};
}

module.exports = List;