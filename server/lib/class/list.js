/**
 * @file list.js
 * @module List
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	listSchema = require("./../schema/listSchema");

var logger = new Logger("List");

function List() {

	/**
	 * backup the list in the database
	 * 
	 * @returns {promise}
	 */
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

	/**
	 * get a list by its name
	 * 
	 * @param listName
	 * @returns {promise}
	 */
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
					if(doc.hasOwnProperty('hasRank')) {
						doc.items.sort(function(a,b) { return a.rank - b.rank } );
					}

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

	/**
	 * Send back the translation of a list
	 * 
	 * Only item with a translation in the selected language are send
	 * 
	 * @param lang
	 * @returns {promise}
	 */
	this.lang = function( lang ) {
		var that = this;
		return new promise( function( resolve, reject ) {
			logger.trace("lang", that.name, lang );
			if( !lang || physioDOM.config.languages.indexOf(lang) === -1 ) {
				logger.warning("unsupported language ", lang);
				reject( { code:405, message:"unrecognized language"});
			}
			var options = { defaultValue: that.defaultValue, items:[] };
			var count = that.items.length;
			if( count === 0) {
				resolve( options );
			} else {
				that.items.forEach(function (listItem) {
					if (( !listItem.hasOwnProperty("active") || listItem.active === true) ) {
						var label;
						if( listItem.label[lang] === undefined && listItem.label.en === undefined ) {
							label = listItem.ref;
						} else {
							label = listItem.label[lang] || listItem.label.en;
						}
						options.items.push({value: listItem.ref, label: label  });
					}
					if (--count === 0) {
						// logger.debug("-> Lang ", options );
						resolve(options);
					}
				});
			}
		});
	};

	/**
	 * Activate or deactivate an item of the list
	 * 
	 * the item to modify is given by its reference : `itemRef`
	 * the activation is done by sending an object :
	 *     { active: true|false }
	 * 
	 * @param itemRef
	 * @param activate
	 * @returns {promise}
	 */
	this.activateItem = function( itemRef, activate ) {
		var that = this;
		return new promise( function(resolve, reject) {
			if( !activate.hasOwnProperty("active") ) {
				throw { code:405, message:"bad activate message"};
			}
			logger.trace("activeItem", itemRef);
			that.getItemIndx(itemRef)
				.then(function (indx) {
					that.items[indx].active = activate.active;
					return that.save();
				})
				.then(function (list) {
					resolve(list);
				})
				.catch(function (err) {
					reject(err);
				});
		});
	};

	/**
	 * Update the list
	 * 
	 * `updatedEntry` is a full object that replace the old one
	 * 
	 * @param updatedEntry
	 * @returns {promise}
	 */
	this.update = function( updatedEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("update");
			if( that._id.toString() !== updatedEntry._id ) {
				logger.warning("not same beneficiary");
				throw { code:405, message:"not same list"};
			}
			updatedEntry._id = that._id;
			var check = listSchema.validator.validate( updatedEntry, { "$ref":"/List"} );
			if( check.errors.length ) {
				 return reject( { code:405, message:"bad format", detail: check.errors });
			}

			for (var key in updatedEntry) {
				if (key !== "_id" && updatedEntry.hasOwnProperty(key)) {
					that[key] = updatedEntry[key];
				}
			}
			that.save();
			resolve(that);
		});
	};

	/**
	 * Add an item object to the list
	 * 
	 * The list must be editable, if the item already exists it's updated
	 * 
	 * if all OK, resolve with the list
	 * else reject an error
	 * 
	 * @param item
	 * @returns {promise}
	 */
	this.addItem = function( item ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("addItem", that.name);
			if( that.editable === false ) {
				return reject( {code:405, message:"list not editable"});
			}
			var check = listSchema.validate( item, { "$ref":'/ListItem_Basic' } );
			if(check.errors.length){
				check = listSchema.validate( item, { "$ref":'/ListItem_Measurable' } );
				if( check.errors.length ) {
					return reject( { code:405, message:"bad format", detail: check.errors });
				}
			}

			var indx = -1;
			item.active = true;   // adding an item automatically active it
			that.items.forEach( function(listItem , i) {
				if( listItem.ref === item.ref ) {
					indx = i;
				}
			});
			if( indx !== -1) {
				// update the item
				that.items[indx] = item;
			} else {
				that.items.push( item );
			}
			resolve( that );

			return that.save();
		});
	};

	/**
	 * get the index of an item of the list given by its reference `itemRef`
	 * 
	 * if found, the promise send the index
	 * else send an error message.
	 * 
	 * @param itemRef
	 * @returns {promise}
	 */
	this.getItemIndx = function( itemRef ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getItemIndx", itemRef);
			var indx = -1;
			that.items.forEach( function( item, i) {
				if( item.ref === itemRef ) {
					indx = i;
				} 
			});
			if(indx !== -1) {
				resolve( indx );
			} else {
				reject( {code:404, message:"item not found"});
			}
		});
	};

	/**
	 * Add translation to a list item given by its reference `itemRef`
	 * 
	 * translation is the object containing the translation
	 * ex { es:"administrador", nl:"beheerder" }
	 *
	 * if all is OK, the promise send back the list
	 * else send reject an error
	 * 
	 * @param itemRef
	 * @param translation
	 * @returns {promise}
	 */
	this.translateItem = function( itemRef, translation ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("translateItem", itemRef);
			that.getItemIndx( itemRef )
				.then( function(indx) {
					for( var lang in translation ) {
						if( physioDOM.config.languages.indexOf( lang ) === -1 ) {
							throw { code:405, message:"lang '"+lang+"' is not managed"};
						} else {
							that.items[indx].label[lang] = translation[lang];
						}
					}
					return that.save();
				})
				.then( function(list) {
					resolve(list);
				})
				.catch( function(err) {
					reject(err);
				});
		});
	};
	
	this.getItem = function( itemRef ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getItem", itemRef);
			that.getItemIndx( itemRef )
				.then( function(indx) {
					resolve( that.items[indx] );
				})
				.catch( function(err) {
					reject(err);
				});
		});
	};
}

module.exports = List;