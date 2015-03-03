/**
 * @file beneficiary.js
 * @module Beneficiary
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var RSVP = require("rsvp"),
	promise = require("rsvp").Promise,
	Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	beneficiarySchema = require("./../schema/beneficiarySchema"),
	DataRecord = require("./dataRecord"),
	Messages = require("./messages"),
	DataProg = require("./dataProg"),
	DataProgItem = require("./dataProgItem"),
	QuestionnairePlan = require("./questionnairePlan"),
	DietaryPlan = require("./dietaryPlan"),
	PhysicalPlan = require("./physicalPlan"),
	Events = require("./events"),
	dbPromise = require("./database"),
	Queue = require("./queue.js"),
	Symptoms = require("./symptoms.js"),
	moment = require("moment");

var logger = new Logger("Beneficiary");

function capitalize(str) {
	return str.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
}

/**
 * Manage a beneficiary record
 * 
 * @constructor
 */
function Beneficiary( ) {

	/**
	 * Get a beneficiary in the database known by its ID
	 * 
	 * on success the promise returns the beneficiary record,
	 * else return an error ( code 404 )
	 * 
	 * @param beneficiaryID
	 * @param professional
	 * @returns {promise}
	 */
	this.getById = function( beneficiaryID, professional ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getById", beneficiaryID);
			var search = { _id: beneficiaryID };
			if( ["administrator","coordinator"].indexOf(professional.role) === -1) {
				search.professionals = { '$elemMatch' : { professionalID: professional._id.toString() }};
			}
			
			physioDOM.db.collection("beneficiaries").findOne(search, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"beneficiary not found"});
				} else {
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					if( !that.address ) {
						that.address = [ { use:"home" }];
					}
					if( !that.telecom ) {
						that.telecom = [ { system:"phone" }];
					}
					resolve(that);
				}
			});
		});
	};

	/**
	 * Get a beneficiary known by its ID : `beneficiaryID`
	 * 
	 * This method is used to create or modify a beneficiary
	 * the professional must be an administrator or a coordinator
	 * 
	 * if beneficiaryID is null the promise return an empty structure
	 * 
	 * @param beneficiaryID
	 * @param professional
	 * @returns {promise}
	 */
	this.getAdminById = function( beneficiaryID, professional ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getAdminById", beneficiaryID);
			var result = { telecom: [ { system:"phone" } ], address:[ { use:"home"} ] };
			that.getById(beneficiaryID, professional)
				.then(function (beneficiary) {
					result = beneficiary;
					return beneficiary.getAccount();
				})
				.then( function(account) {
					result.account = account;
					resolve(result);
				})
				.catch( function( err ) {
					logger.warning("error",err);
					resolve(result);
				});
		});
	};

	/**
	 * Get a beneficiary in the database known by its ID
	 * this method is only used by the Queue API
	 *
	 * on success the promise returns the beneficiary record,
	 * else return an error ( code 404 )
	 *
	 * @param beneficiaryID
	 * @param professional
	 * @returns {promise}
	 */
	this.getHHR = function( beneficiaryID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getHHR", beneficiaryID);
			var search = { _id: beneficiaryID };

			physioDOM.db.collection("beneficiaries").findOne(search, function (err, doc) {
				if (err) {
					logger.alert("Error");
					throw err;
				}
				if(!doc) {
					reject( {code:404, error:"beneficiary not found"});
				} else {
					for (var prop in doc) {
						if (doc.hasOwnProperty(prop)) {
							that[prop] = doc[prop];
						}
					}
					if( !that.address ) {
						that.address = [ { use:"home" }];
					}
					if( !that.telecom ) {
						that.telecom = [ { system:"phone" }];
					}
					resolve(that);
				}
			});
		});
	};
	
	/**
	 * return account information about the beneficiary
	 *
	 * the promise resolve with account information as object,
	 * if no account information is found the resolve return an empty object
	 *
	 * @returns {promise}
	 */
	this.getAccount = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			var search = { "person.id": that._id };
			physioDOM.db.collection("account").findOne( search, function( err, item ) {
				if(err) {
					throw err;
				} else {
					resolve(item || {});
				}
			});
		});
	};

	/**
	 * save the beneficiary in the database
	 * 
	 * the promise return the beneficiary object completed with the `_id` for a new record
	 * 
	 * @returns {promise}
	 */
	this.save = function() {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("-> save" );
			
			physioDOM.db.collection("beneficiaries").save( that, function(err, result) {
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
	 * Check that there's no beneficiary already exists with the same
	 *  name, birthdate and telecom
	 *  
	 * @todo set a regexp case insensitive for the name
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkUniq( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkUniq");
			// check that the entry have an email
			
			var filter = { name: entry.name, birthdate: entry.birthdate, telecom: entry.telecom };
			if( entry._id ) {
				filter._id = { "$ne": new ObjectID(entry._id) };
			}
			physioDOM.db.collection("beneficiaries").count( filter , function(err,nb) {
				if(err) {
					logger.error(err);
					reject(err);
				}
				if(nb > 0) {
					logger.warning("duplicate");
					reject({error:"duplicate"});
				} else {
					resolve( entry );
				}
			});
		});
	}

	/**
	 * Check the schema of a beneficiary record
	 * 
	 * @param entry
	 * @returns {promise}
	 */
	function checkSchema( entry ) {
		return new promise( function(resolve, reject) {
			logger.trace("checkSchema");
			var check = beneficiarySchema.validator.validate( entry, { "$ref":"/Beneficiary"} );
			if( check.errors.length ) {
				// console.log(JSON.stringify(check.errors,null,4));
				return reject( { error:"bad format", detail: check.errors } );
			} else {
				return resolve(entry);
			}
		});
	}

	/**
	 * initialize a beneficiary with the object `newEntry`
	 * 
	 * the promise return on success the beneficiary record
	 * 
	 * @param newEntry
	 * @returns {promise}
	 */
	this.setup = function( newEntry ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("setup");
			checkSchema(newEntry)
				.then(checkUniq)
				.then(function (entry) {
					for (var key in newEntry) {
						if (newEntry.hasOwnProperty(key)) {
							switch(key) {
								case "name":
									that.name = newEntry.name;
									that.name.family = capitalize(that.name.family);
									that.name.given = capitalize(that.name.given);
									break;
								default:
									that[key] = newEntry[key];
							}
						}
					}
					return that.save();
				})
				.then(resolve)
				.catch(reject);
		});
	};

	/**
	 * Update the beneficiary
	 * 
	 * `updatedEntry` is a full object that replace the old one
	 * 
	 * @param updatedEntry
	 * @returns {promise}
	 */
	this.update = function( updatedEntry, professionalID) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("update");
			if( that._id.toString() !== updatedEntry._id ) {
				logger.warning("not same beneficiary");
				throw { code:405, message:"not same beneficiary"};
			}
			updatedEntry._id = that._id;
			checkSchema(updatedEntry)
				.then(function (updatedEntry) {
					logger.debug("schema is valid");
					for (var key in updatedEntry) {
						if (key !== "_id" && updatedEntry.hasOwnProperty(key)) {
							switch(key) {
								case "name":
									that.name = updatedEntry.name;
									that.name.family = capitalize(that.name.family);
									that.name.given = capitalize(that.name.given);
									break;
								default:
									that[key] = updatedEntry[key];
							}
						}
					}
					return that.save();
				})
				.then( function() {
					that.createEvent("Beneficiary","update", updatedEntry._id, professionalID);
				})
				.then(resolve)
				.catch(reject);
		});
	};

	this.getEvents = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getEvents");
			resolve({});
		});
	};

	this.getHealthServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getHealthServices");
			resolve({});
		});
	};

	this.getSocialServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getSocialServices");
			resolve({});
		});
	};

	this.getDietaryServices = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getDietaryServices");
			resolve({});
		});
	};

	/**
	 * Get Professionals list attached to the beneficiary
	 * 
	 * @returns {promise}
	 */
	this.getProfessionals = function(jobFilter) {
		var that = this,
			proList = [];
		if( that.professionals === undefined ) {
			that.professionals = [];
		}
		return new promise( function(resolve, reject) {
			logger.trace("getProfessionals");
			var count = that.professionals.length;
			that.professionals.sort( function(a,b) { return b.referent?true:false; });
			if( !count ) {
				resolve( [] );
			}
			physioDOM.Directory()
				.then(function (directory) {
					that.professionals.forEach( function( item, i ) {
						directory.getEntryByID( item.professionalID.toString() )
							.then( function( professional ) {
								that.professionals[i] = professional;
								that.professionals[i].referent = item.referent;

								if(jobFilter && jobFilter.indexOf(that.professionals[i].role) !== -1 ) {
									// && that.professionals[i].active : to filter only active professionnal
									proList.push(that.professionals[i]);
								}
							})
							.then( function() {
								if( --count === 0) {
									if(jobFilter) {
										resolve( proList );
									} else {
										resolve( that.professionals );
									}
								}
							})
							.catch( function(err) {
								if( --count === 0) {
									resolve( that.professionals );
								}
							});
					});
				})
				.catch( function(err) {
					logger.error("error ",err);
					reject(err);
				});
		});
	};

	this.hasProfessional = function( professionalID ) {
		var that = this;
		if( that.professionals === undefined ) {
			that.professionals = [];
		}
		return new promise( function(resolve, reject) {
			logger.trace("hasProfessional", professionalID);
			var hasProfessional = false;
			that.professionals.forEach( function(professional) {
				if( professional.professionalID === professionalID.toString() ) { 
					hasProfessional = true;
				}
			});
			resolve( hasProfessional );
		});
	};
	
	/**
	 * Attach a professional to the beneficiary
	 * 
	 * @param professionalID
	 * @param referent
	 * @returns {promise}
	 */
	this.addProfessional = function( professionalID, referent ) {
		var that = this;
		if( !that.professionals ) {
			that.professionals = [];
		}
		return new promise(function (resolve, reject) {
			logger.trace("addProfessional ", professionalID);
			physioDOM.Directory()
				.then(function (directory) {
					return directory.getEntryByID(professionalID);
				})
				.then( function( professional ) {
					// check if professional is already added
					var indx = -1;
					that.professionals.forEach( function( item, i ) {
						if ( item.professionalID.toString() === professional._id.toString() ) {
							// console.log("professional found");
							indx = i;
						}
					});
					// console.log("indx", indx);
					if(indx !== -1) {
						that.professionals[indx] = {professionalID: professional._id, referent: referent || false};
					} else {
						that.professionals.push({professionalID: professional._id, referent: referent || false});
					}
					return that.save();
				})
				.then( function() {
					return that.getProfessionals();
				})
				.then( function(professionals) {
					resolve(professionals);
				})
				.catch( function(err) {
					logger.error("error ",err);
					reject(err);
				});
		});
	};

	/**
	 * Attach an array of professionals to the beneficiary
	 *
	 * @param professionals {array} array of objects 
	 *        { professionalID: xxxx, referent: true|false }`
	 * @param referent
	 * @returns {promise}
	 */
	this.addProfessionals = function( professionals ) {
		var that = this;
		if( !that.professionals ) {
			that.professionals = [];
		}
		
		return new promise(function (resolve, reject) {
			logger.trace("addProfessionals ");
			physioDOM.Directory()
				.then(function (directory) {
					function check( professionalObj ) {
						return new promise(function (resolve, reject) {
							directory.getEntryByID(professionalObj.professionalID)
								.then(function( professional) {
									resolve({
										professionalID: professional._id,
										referent: professionalObj.referent && professionalObj.referent===true?true:false
									});
								})
								.catch( function(err) {
									reject(err);
								} );
						});
					}
					
					return RSVP.all(professionals.map(check));
				})
				.then( function( professionals ) {
					that.professionals = professionals;
					return that.save();
				})
				.then( function() {
					return that.getProfessionals();
				})
				.then( function(professionals) {
					resolve(professionals);
				})
				.catch( function(err) {
					logger.error("error ",err);
					reject(err);
				});
		});
	};
	
	/**
	 * remove a professional from a beneficiary
	 * 
	 * @param professionalID
	 * @returns {promise}
	 */
	this.delProfessional = function( professionalID ) {
		var that = this;
		if( !that.professionals ) {
			that.professionals = [];
		}
		return new promise(function (resolve, reject) {
			logger.trace("delProfessional ", professionalID);
			physioDOM.Directory()
				.then(function (directory) {
					return directory.getEntryByID(professionalID);
				})
				.then(function (professional) {
					// check if professional is already added
					var indx = -1;
					
					that.professionals.forEach(function (item, i) {
						if (item.professionalID.toString() === professional._id.toString()) {
							indx = i;
						}
					});
					if (indx !== -1) {
						if (that.professionals.length > 1) {
							that.professionals.splice(indx, 1);
						} else {
							that.professionals = [];
						}
						return that.save();
					} else {
						throw {code: 404, message: "-> professional " + professionalID + " not found"};
					}
				})
				.then(function () {
					return that.getProfessionals();
				})
				.then(function (professionals) {
					resolve(professionals);
				})
				.catch(function (err) {
					logger.error("error ", err);
					reject(err);
				});
		});	
	};

	/**
	 * Not implemented
	 * 
	 * @returns {promise}
	 */
	this.getContacts = function() {
		return new promise( function(resolve, reject) {
			logger.trace("getContact");
		});
	};

	/**
	 * on resolve return the list of dataRecords of the current beneficiary
	 * 
	 * dataRecords are sorted by default by date
	 * 
	 * @param pg
	 * @param offset
	 * @param sort
	 * @param sortDir
	 * @param filter
	 * @returns {promise}
	 */
	this.getDataRecords = function(pg, offset, sort, sortDir, filter) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getDataRecords");
			physioDOM.DataRecords( that._id )
				.then( function( datarecords ) {
					resolve( datarecords.getList(pg, offset, sort, sortDir, filter) );
				});
		});
	};

	/**
	 * on resolve return a complete DataRecord for display
	 * 
	 * @param dataRecordID
	 * @returns {promise}
	 */
	this.getCompleteDataRecordByID = function( dataRecordID ) {
		var that = this;
		
		return new promise( function(resolve, reject) {
			logger.trace("getCompleteDataRecordByID", dataRecordID);
			physioDOM.DataRecords( that._id )
				.then( function (datarecords ) {
					return datarecords.getByID( new ObjectID(dataRecordID) );
				})
				.then( function( datarecord ) {
					resolve( datarecord.getComplete());
				})
				.catch( function(err) {
					logger.error("error ", err);
					reject(err);
				});
		});
	};

	this.getDataRecordByID = function( dataRecordID ) {
		var that = this;

		return new promise( function(resolve, reject) {
			logger.trace("getDataRecordByID", dataRecordID);
			physioDOM.DataRecords( that._id )
				.then( function (datarecords ) {
					return datarecords.getByID( new ObjectID(dataRecordID) );
				})
				.then( resolve )
				.catch( function(err) {
					logger.error("error ", err);
					reject(err);
				});
		});
	};

	this.deleteDataRecordByID = function( dataRecordID ) {
		return new promise( function(resolve, reject) {
			logger.trace("getDataRecordByID", dataRecordID);
			var search = { _id: new ObjectID( dataRecordID ) };
			physioDOM.db.collection("dataRecords").remove(search, function (err, nb) {
				if (err) {
					reject(err);
				}
				resolve(nb);
			});
		});
	};
	
	/**
	 * Create a dataRecord for the current beneficiary from the given dataRecordObj
	 * 
	 * on resolve return the full dataRecord Object
	 * 
	 * @param dataRecordObj
	 * @returns {promise}
	 */
	this.createDataRecord = function( dataRecordObj, professionalID) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("createDataRecord", dataRecordObj);
			var dataRecord = new DataRecord();
			dataRecord.setup(that._id, dataRecordObj, professionalID)
				.then(function (dataRecord) {
					return that.createEvent('Data record', 'create', dataRecord._id, professionalID)
				})
				.then( function() {
					return that.pushLastDHDFFQ();
				})
				.then( function() {
					return that.pushHistory();
				})
				.then( function() {
					return that.getCompleteDataRecordByID(dataRecord._id);
				})
				.then(resolve)
				.catch(reject);
		});
	};
	
	this.getThreshold = function() {
		var thresholdResult = {};
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getThreshold", that._id);
			dbPromise.findOne(physioDOM.db, "lists", {name: "parameters"}, {"items.ref": 1, "items.threshold": 1, "items.active":1})
				.then(function (thresholds) {
					thresholds.items.forEach(function (threshold) {
						if( threshold.active ) {
							thresholdResult[threshold.ref] = threshold.threshold;
						}
					});
					return thresholdResult;
				})
				.then(function (thresholdResult) {
					for (var prop in that.threshold) {
						if (thresholdResult.hasOwnProperty(prop)) {
							thresholdResult[prop] = that.threshold[prop];
						}
					}
					resolve(thresholdResult);
				});
		});
	};

	/**
	 * update the threshold limits of the current beneficiary with
	 * the given "updatedThresholds" object
	 *
	 * @param updatedThresholds
	 * @returns {promise}
	 */
	this.setThresholds = function( updatedThresholds ) {
		var that = this;
		
		return new promise( function(resolve, reject) {
			logger.trace("setThreshold", that._id);
			
			that.getThreshold()
				.then( function( thresholdResult ) {
					if( that.threshold === undefined ) { 
						that.threshold = {}; 
					}
					for (var prop in updatedThresholds) {
						if (thresholdResult.hasOwnProperty(prop)) {
							// console.log("test ", Object.keys(updatedThresholds[prop]));
							if (JSON.stringify(Object.keys(updatedThresholds[prop])) === JSON.stringify(['min', 'max'])) {
								that.threshold[prop] = updatedThresholds[prop];
							} else {
								logger.warning("bad threshold object for '" + prop + "'");
							}
						}
					}
					return that.save();
				})
				.then( function() {
					return that.getThreshold();
				})
				.then( function( thresholdResult) {
					resolve(thresholdResult);
				})
				.catch( function(err) {
					reject(err);
				});
		});
	};
	
	this.getMessages = function( pg, offset, sort, sortDir, filter ) {
		logger.trace("getMessages");

		var messages = new Messages( this._id );
		return messages.list( pg, offset, sort, sortDir, filter );
	};

	/**
	 * Create a message to home
	 * 
	 * @param professionalID
	 * @param msg
	 */
	this.createMessage = function( session, professionalID, msg ) {
		logger.trace("createMessage");

		var messages = new Messages( this._id ),
			that = this;

		return messages.create( session, professionalID, msg ).then(function(message) {
			that.createEvent('Message', 'create', message._id, professionalID);
		});
	};

	this.createEvent = function(service, operation, elementID, senderID) {
		logger.trace("create event", service);
		var events = new Events(this._id);
		var that = this;

		return events.setup(service, operation, elementID, senderID)
			.then(function(eventObj) {
				that.lastEvent = eventObj.datetime;
				that.save();
			});
	};

	this.getGraphDataList = function( lang ) {
		var that = this;

		return new promise(function (resolve, reject) {
			logger.trace("getGraphDataList", that._id);
			var graphList = {
				"General"      : [],
				"HDIM"         : [],
				"symptom"      : [],
				"questionnaire": []
			};

			var reduceFunction = function ( curr, result ) {
				if(result.lastReport < curr.datetime) {
					result.lastReport = curr.datetime;
					result.lastValue = curr.value;
				}
				if(!result.firstReport || result.firstReport > curr.datetime) {
					result.firstReport = curr.datetime;
					result.firstValue = curr.value;
				}
			};

			var groupRequest = {
				key    : {text: 1, category: 1},
				cond   : {subject: that._id},
				reduce : reduceFunction.toString(),
				initial: {lastReport: "", firstReport: "", lastValue: 0, firstValue: 0}
			};

			function compareItems(a, b) {
				if (a.text < b.text) {
					return -1;
				}
				if (a.text > b.text) {
					return 1;
				}
				return 0;
			}

			var promises = ["parameters", "symptom", "questionnaire"].map(function (listName) {
				return physioDOM.Lists.getList(listName);
			});
			
			var thresholds;
			that.getThreshold()
				.then( function(_thresholds) {
					thresholds = _thresholds;
					return physioDOM.Lists.getList("units");
				})
				.then(function (units) {
					RSVP.all(promises).then(function (lists) {

						var labels = {},
							unitsData = {};

						for (var i = 0; i < lists.length; i++) {
							for (var y in lists[i].items) { // jshint ignore:line
								var ref = lists[i].items[y].ref;

								labels[ref] = lists[i].items[y].label[lang];

								for(var z in units.items) {
									if(units.items[z].ref === lists[i].items[y].units) {
										unitsData[ref] = units.items[z].label[lang];
									}
								}
							}

						}

						physioDOM.db.collection("dataRecordItems").group(groupRequest.key, groupRequest.cond, groupRequest.initial, groupRequest.reduce, function (err, results) {
							if (err) {
								reject(err);
							} else {
								RSVP.all( results.map(function (result) {
											result.name = labels[result.text] || result.text;
											result.unit = unitsData[result.text] || '';
											if (thresholds[result.text]) {
												result.threshold = thresholds[result.text];
											}
											return result;
										})
									)
									.then( function(results) {
										graphList.General = results.filter(function (item) {
											return item.category === "General";
										});
										graphList.HDIM = results.filter(function (item) {
											return item.category === "HDIM";
										});
										graphList.symptom = results.filter(function (item) {
											return item.category === "symptom";
										});
										graphList.questionnaire = results.filter(function (item) {
											return item.category === "questionnaire";
										});

										graphList.General.sort(compareItems);
										graphList.HDIM.sort(compareItems);
										graphList.symptom.sort(compareItems);
										graphList.questionnaire.sort(compareItems);

										resolve(graphList);
									})
									.catch( reject );
							}
						});
					});
				})
				.catch( reject );
		});
	};
	
	
	this.getHistoryDataList = function( lang ) {
		var that = this;

		return new promise(function (resolve, reject) {
			logger.trace("getHistoricDataList", that._id);
			var graphList = {
				"General"      : [],
				"HDIM"         : [],
				"symptom"      : [],
				"questionnaire": []
			};

			var reduceFunction = function ( curr, result ) {
				if( !result.history.length ) {
					result.history.push( { datetime: curr.datetime, value: curr.value} );
				} else {
					var done = false;
					for( var i= 0, l = result.history.length; i < l; i++ ) {
						if ( result.history[i].datetime < curr.datetime ) {
							result.history.splice(i,0, { datetime: curr.datetime, value: curr.value} );
							done = true;
							break;
						}
					}
					if( done === false && result.history.length < 5) {
						result.history.push( { datetime: curr.datetime, value: curr.value} );
					}
					if( result.history.length > 5 ) {
						result.history = result.history.slice(0,5);
					}
				}
			};

			var groupRequest = {
				key    : {text: 1, category: 1, rank:1, precision:1, TVLabel:1 },
				cond   : {subject: that._id},
				reduce : reduceFunction.toString(),
				initial: { history: [] }
			};

			function compareItems(a, b) {
				if (a.text < b.text) {
					return -1;
				}
				if (a.text > b.text) {
					return 1;
				}
				return 0;
			}

			var promises = ["parameters", "symptom", "questionnaire"].map(function (listName) {
				return physioDOM.Lists.getList(listName);
			});

			var thresholds;
			that.getThreshold()
				.then( function(_thresholds) {
					thresholds = _thresholds;
					return physioDOM.Lists.getList("units");
				})
				.then(function (units) {
					RSVP.all(promises).then(function (lists) {
						var labels = {},
							unitsData = {},
							ranks = {},
							TVLabels = {},
							precisions = {};

						for (var i = 0; i < lists.length; i++) {
							for (var y in lists[i].items) { // jshint ignore:line
								var ref = lists[i].items[y].ref;

								labels[ref] = lists[i].items[y].label[lang];
								ranks[ref] = lists[i].items[y].rank || '';
								TVLabels[ref] = lists[i].items[y].TVLabel || '';
								precisions[ref] = lists[i].items[y].precision ? 1 : 0;
								for(var z in units.items) {
									if(units.items[z].ref === lists[i].items[y].units) {
										unitsData[ref] = units.items[z].label[lang];
									}
								}
							}
						}

						physioDOM.db.collection("dataRecordItems").group(groupRequest.key, groupRequest.cond, groupRequest.initial, groupRequest.reduce, function (err, results) {
							if (err) {
								reject(err);
							} else {
								RSVP.all( results.map(function (result) {
										result.name = labels[result.text] || result.text;
										result.unit = unitsData[result.text] || '';
										result.rank = ranks[result.text];
										result.TVLabel = TVLabels[result.text];
										result.precision = precisions[result.text];
										
										if (thresholds[result.text]) {
											result.threshold = thresholds[result.text];
										}
										return result;
									})
								)
									.then( function(results) {
										graphList.General = results.filter(function (item) {
											return item.category === "General";
										});
										graphList.HDIM = results.filter(function (item) {
											return item.category === "HDIM";
										});
										graphList.symptom = results.filter(function (item) {
											return item.category === "symptom";
										});
										graphList.questionnaire = results.filter(function (item) {
											return item.category === "questionnaire";
										});

										graphList.General.sort(compareItems);
										graphList.HDIM.sort(compareItems);
										graphList.symptom.sort(compareItems);
										graphList.questionnaire.sort(compareItems);

										resolve(graphList);
									})
									.catch( reject );
							}
						});
					});
				})
				.catch( reject );
		});
	};
	
	this.getGraphData = function(category, paramName, startDate, stopDate, session ) {
		var graphData = {text: paramName, data: []};
		var that = this;
		
		if (!stopDate) {
			graphData.stopDate = moment().utc();
			graphData.stopDate.hours(23);
			graphData.stopDate.minutes(59);
		} else {
			graphData.stopDate = moment(stopDate);
			graphData.stopDate.hours(23);
			graphData.stopDate.minutes(59);
			if( !graphData.stopDate.isValid() ) {
				throw { code:405, message: "stop date is invalid"};
			}
		}
		if (!startDate) {
			graphData.startDate = moment(graphData.stopDate.toISOString());
			graphData.startDate.subtract(30, "days");
		} else {
			graphData.startDate = moment(startDate);
			graphData.startDate.hours(0);
			graphData.startDate.minutes(0);
			if( !graphData.startDate.isValid() ) {
				throw { code:405, message: "start date is invalid"};
			}
		}
		
		if(graphData.startDate.valueOf() >=  graphData.stopDate.valueOf() ) {
			throw { code:405, message: "start date must be before stop date"};
		}

		// to get the label we need to know from which list comes the parameter
		if (["General", "HDIM"].indexOf(category) !== -1) {
			category = "parameters";
		}

		function paramPromise(listName, param) {
			return new promise(function (resolve, reject) {
				physioDOM.Lists.getList(listName)
					.then(function (list) {
						return list.getItem(paramName);
					})
					.then(function(param) {
						physioDOM.Lists.getList("units")
							.then(function(units) {
								return units.getItem(param.units);
							})
							.then( function(unit) {
								if( unit.label[session.lang || "en"] === undefined ) {
									param.unitLabel = unit.ref;
								} else {
									param.unitLabel = unit.label[session.lang || "en"];
								}
								resolve(param);
							})
							.catch(function() {
								param.unitLabel = "";
								resolve(param);
							});
					})
					.catch(reject);
			});
		}
		
		return new promise(function (resolve, reject) {
			logger.trace("getGraphData", paramName, graphData.startDate, graphData.stopDate);
			
			paramPromise( category, paramName )
				.then( function( param ) {
					graphData.label = param.label[session.lang || "en"] || paramName;
					graphData.unit = param.unitLabel;
					var search = {
						subject : that._id,
						text    : paramName,
						datetime: {
							'$gte': graphData.startDate.toISOString(),
							'$lte': graphData.stopDate.toISOString()
						}
					};
					physioDOM.db.collection("dataRecordItems").find(search).sort({datetime: 1}).toArray(function (err, results) {
						results.forEach(function (result) {
							graphData.data.push([ moment(result.datetime).valueOf(), result.value]);
						});
						resolve(graphData);
					});
				})
				.catch( reject );
		});
	};


	/**
	 * getDataProg
	 * 
	 * @returns {promise}
	 */
	this.getDataProg = function() {
		var that = this;

		return new promise( function(resolve, reject) {
			logger.trace("getDataProg", that._id);
			resolve( {} );
		});
	};

	/**
	 * get the data prescription for a given category
	 * 
	 * category is one of "General","HDIM","symptom","questionnaire"
	 * 
	 * the promise, if succeed, return an array of all data prescription.
	 * 
	 * @param category
	 * @returns {*}
	 */
	this.getDataProgCategory = function( category ) {
		var that = this;
		logger.trace("getDataProgCategory", that._id, category );
		
		var dataProg = new DataProg( that._id );
		return dataProg.getCategory( category );
	};

	/**
	 * add a data prescription`defined by the given `prescription` object
	 *
	 * @param prescription 
	 * @returns {promise}
	 */
	this.setDataProg = function( prescription ) {
		var that = this;
		logger.trace("setDataProg", that._id, prescription.ref );

		var dataProgItem = new DataProgItem( that._id );
		return dataProgItem.setup( prescription );
	};
	
	this.delDataProg = function( dataProgItemID ) {
		var that = this;
		logger.trace("delDataProg", that._id, dataProgItemID );

		var dataProg = new DataProg( that._id );
		return dataProg.remove( dataProgItemID );
	};
	
	this.questionnairePlan = function() {
		logger.trace("questionnairePlan", this._id );
		return  new QuestionnairePlan( this._id );
	};

	/**
	 * Dietary Plan
	 */

	this.createDietaryPlan = function( dietaryPlanObj, professionalID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("createDietaryPlan");
			var dietaryPlan = new DietaryPlan(new ObjectID(that._id));
			dietaryPlan.setup(that._id, dietaryPlanObj, professionalID)
				.then(resolve)
				.catch(reject);
		});
	};

	this.getDietaryPlan = function() {
		var that = this;

		return new promise( function(resolve, reject) {
			logger.trace("getDietaryPlan");
			var dietaryPlan = new DietaryPlan(new ObjectID(that._id));
			dietaryPlan.getLastOne()
				.then( resolve )
				.catch( function(err) {
					logger.error("error ", err);
					reject(err);
				});
		});
	};

	this.getDietaryPlanList = function(pg, offset, sort, sortDir, filter) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getDietaryPlanList");
			var dietaryPlan = new DietaryPlan(new ObjectID(that._id));
			resolve(dietaryPlan.getItems(pg, offset, sort, sortDir, filter));
		});
	};

	/**
	 * Physical Plan
	 */

	this.createPhysicalPlan = function( physicalPlanObj, professionalID ) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("createPhysicalPlan");
			var physicalPlan = new PhysicalPlan(new ObjectID(that._id));
			physicalPlan.setup(that._id, physicalPlanObj, professionalID)
				.then(resolve)
				.catch(reject);
		});
	};

	this.getPhysicalPlan = function() {
		var that = this;

		return new promise( function(resolve, reject) {
			logger.trace("getPhysicalPlan");
			var physicalPlan = new PhysicalPlan(new ObjectID(that._id));
			physicalPlan.getLastOne()
				.then( resolve )
				.catch( function(err) {
					logger.error("error ", err);
					reject(err);
				});
		});
	};

	this.getPhysicalPlanList = function(pg, offset, sort, sortDir, filter) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getPhysicalPlanList");
			var physicalPlan = new PhysicalPlan(new ObjectID(that._id));
			resolve(physicalPlan.getItems(pg, offset, sort, sortDir, filter));
		});
	};

	this.getEventList = function(pg, offset, sort, sortDir, filter) {
		var that = this;
		return new promise( function(resolve, reject) {
			logger.trace("getEventList");
			var events = new Events(new ObjectID(that._id));
			resolve(events.getItems(pg, offset, sort, sortDir, filter));
		});
	};

	function pushMeasure( queue, leaf, units, parameters, measures ) {
		return new promise( function(resolve,rejet) {
			var msg = [];
			// logger.debug( "measure", measures );
			// logger.debug( "parameters", parameters );
			msg.push({
				name : leaf + ".datetime",
				value: measures.datetime,
				type : "Integer"
			});
			msg.push({
				name : leaf + ".new",
				value: 1,
				type : "Integer"
			});
			var hasMeasure = false;
			measures.measure.forEach( function( measure ) {
				if( parameters[measure].rank ) {
					hasMeasure = true;
					var name = leaf + ".param['"+parameters[measure].ref+"']";
					msg.push({
						name : name + ".type",
						value: parseInt(parameters[measure].rank, 10),
						type : "Integer"
					});
					msg.push({
						name : name + ".label",
						value: parameters[measure].label[physioDOM.lang],
						type : "String"
					});
					msg.push({
						name : name + ".min",
						value: parameters[measure].range.min,
						type : "Double"
					});
					msg.push({
						name : name + ".max",
						value: parameters[measure].range.max,
						type : "Double"
					});
					msg.push({
						name : name + ".precision",
						value: parameters[measure].precision?1:0,
						type : "Integer"
					});
					if(parameters[measure].unit ) {
						msg.push({
							name : name + ".unit",
							value: parameters[measure].unit,
							type : "String"
						});
					}
				}
			});
			if( hasMeasure ) {
				queue.postMsg(msg)
					.then(function () {
						resolve(msg);
					});
			} else {
				resolve([]);
			}
		});
	}

	this.dropMeasurePlan = function() {
		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "]";
		var that = this;
		
		logger.trace("dropMeasurePlan");
		return new promise( function(resolve, reject) {
			physioDOM.db.collection("agendaMeasure").find({subject: that._id}).toArray(function (err, list) {
				var promises = list.map(function (measure) {
					console.log( measure );
					var msg = [];
					msg.push({
						branch: name + ".measures[" + measure.datetime + "]"
					});
					return queue.delMsg(msg);
				});
				RSVP.all(promises)
					.then(function() {
						physioDOM.db.collection("agendaMeasure").drop( function(err, res) {
							resolve();
						});
					});
			});
		});
	};
	
	/**
	 * get the measure Plan and push it to the box
	 * 
	 * @param date
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.getMeasurePlan = function( ) {
		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "]";
		
		var today = moment().hour(12).minute(0).second(0);
		var endDate = moment().add(14,'d').hour(12).minute(0).second(0);
		var dataProg = new DataProg( this._id );
		var msgs = [];
		var that = this;
		
		return new promise( function(resolve, reject) {
			var promises = ["General","HDIM"].map(function (category) {
				return dataProg.getCategory( category );
			});

			that.dropMeasurePlan()
				.then( function() {
					RSVP.all(promises)
						.then(function (results) {
							var progs = [];
							results.forEach(function (list) {
								progs = progs.concat(list);
							});
							progs.forEach(function (prog) {
								var startDate, nextDate, firstDay, dat, closeDate;
								switch (prog.frequency) {
									case "daily":
										startDate = moment().subtract(prog.repeat, 'd');
										nextDate = moment(prog.startDate).hour(12).minute(0).second(0);
										closeDate = moment(prog.endDate).hour(12).minute(0).second(0);
										closeDate = closeDate.unix() < endDate.unix() ? closeDate:endDate;
										while (nextDate.unix() < startDate.unix()) {
											nextDate.add(prog.repeat, 'd');
										}
										if (nextDate.unix() <= closeDate.unix()) {
											do {
												if (nextDate.unix() <= closeDate.unix() && nextDate.unix() > today.unix()) {
													msgs.push({ref: prog.ref, date: nextDate.unix()});
												}
												nextDate.add(prog.repeat, 'd');
											} while (nextDate.unix() <= closeDate.unix());
										}
										break;
									case "weekly":
										startDate = moment().subtract(prog.repeat, 'w');
										nextDate = moment(prog.startDate).day(prog.when.days[0]).hour(12).minute(0).second(0);
										closeDate = moment(prog.endDate).hour(12).minute(0).second(0);
										closeDate = closeDate.unix() < endDate.unix() ? closeDate:endDate;
										while (nextDate.unix() < startDate.unix()) {
											nextDate.add(prog.repeat, 'w');
										}
										if (nextDate.unix() <= closeDate.unix()) {
											do {
												firstDay = moment.unix(nextDate.unix());
												prog.when.days.forEach(function (day) {
													firstDay.day(day);
													if (firstDay.unix() <= closeDate.unix() && firstDay.unix() > today.unix()) {
														msgs.push({ref: prog.ref, date: firstDay.unix()});
													}
												}); // jshint ignore:line
												nextDate.add(prog.repeat, 'w');
											} while (nextDate.unix() <= closeDate.unix());

										}
										break;
									case "monthly":
										startDate = moment().date(1).hour(12).minute(0).second(0);
										nextDate = moment(prog.startDate).date(1).hour(12).minute(0).second(0);
										closeDate = moment(prog.endDate).hour(12).minute(0).second(0);
										closeDate = closeDate.unix() < endDate.unix() ? closeDate:endDate;
										while (nextDate.unix() < startDate.unix()) {
											nextDate.add(prog.repeat, 'M');
										}
										logger.debug("nextDate", nextDate.format("L"));
										if (nextDate.unix() <= closeDate.unix()) {
											prog.when.days.forEach(function (day) {
												if (day > 0) {
													dat = moment.unix(nextDate.unix());
													dat.day(day % 10);
													dat.add(Math.floor(day / 10) - 1, 'w');
												} else {
													dat = moment.unix(nextDate.unix()).add(1, 'M').subtract(1, 'd');
													dat.day(-day % 10);
													dat.subtract(Math.floor(-day / 10) - 1, 'w');
												}
												if (dat.unix() <= closeDate.unix() && dat.unix() > today.unix()) {
													msgs.push({ref: prog.ref, date: dat.unix()});
												}
											});
										}
										break;
								}
							});
							var agenda = {};
							msgs.forEach(function (msg) {
								if (agenda[msg.date]) {
									agenda[msg.date].measure.push(msg.ref);
								} else {
									agenda[msg.date] = {
										datetime: msg.date,
										measure : [msg.ref],
										date    : moment.unix(msg.date).toISOString()
									};
								}
							});
							var measures = [];
							for (var measure in agenda) { // jshint ignore:line
								measures.push(agenda[measure]);
							}

							var units;
							physioDOM.Lists.getListItemsObj("units")
								.then(function (results) {
									units = results;
									return physioDOM.Lists.getListItemsObj("parameters");
								})
								.then(function (parameters) {
									physioDOM.Lists.getListItemsObj("parameters")
										.then(function (parameters) {
											var promises = measures.map(function (measure) {
												return new promise(function (resolve, reject) {
													console.log(JSON.stringify(measure, "", 4));
													measure.subject = that._id;

													pushMeasure(queue, name + ".measures[" + measure.datetime + "]", units, parameters, measure)
														.then(function (msg) {
															if (msg.length) {
																physioDOM.db.collection("agendaMeasure").save(measure, function (err, doc) {
																	resolve(msg);
																});
															} else {
																resolve(msg);
															}
														});
												});
											});
											RSVP.all(promises)
												.then(function (result) {
													var res = [];
													result.forEach(function (item) {
														if (item.length > 0) {
															res.push(item);
														}
													});
													resolve(res);
												});
										});
								});
						});
				});
		});
	};

	/**
	 * Push a symptom Self to the queue
	 * 
	 * @param symptomSelf
	 */
	this.pushSymptomsSelfToQueue = function( symptomSelf ) {
		logger.trace("pushSymptomsSelfToQueue");
		
		var queue = new Queue(this._id);
		var leaf = "hhr[" + this._id + "].symptomsSelf.scale['"+symptomSelf.ref+"']";
		
		return new promise( function(resolve, reject) {
			var msg = [];
			if( !symptomSelf.active ) {
				resolve(false);
			}
			msg.push({
				name : leaf + ".label",
				value: symptomSelf.label[physioDOM.lang] || symptomSelf.ref,
				type : "String"
			});
			if( symptomSelf.history ) {
				msg.push({
					name: leaf + ".lastValue",
					value: symptomSelf.history[0].value,
					type: "Integer"
				});
			}
			queue.postMsg(msg)
				.then(function () {
					resolve(msg);
				});
		});
		
	};

	/**
	 * Push the whole symptoms self to queue
	 */
	this.symptomsSelfToQueue = function( ) {
		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "].symptomsSelf";
		var that = this;
		logger.trace("symptomsSelfToQueue");
		
		var symptoms = new Symptoms( this );
		
		return new promise( function(resolve,reject) {
			queue.delMsg([ { branch : name} ])
				.then(function () {
					logger.trace("symptomsSelf cleared");
					return symptoms.getHistoryList();
				})
				.then( function( list ) {
					var promises = Object.keys(list).map(function (key ) {
						var symptomSelf = list[key];
						return that.pushSymptomsSelfToQueue( symptomSelf );
					});
					RSVP.all(promises)
						.then(function (results) {
							resolve(results);
						});
				});
		});
	};

	function pushSymptom( queue, leaf, symptoms, measures ) {
		logger.trace("pushSymptom");
		return new promise( function(resolve,reject) {
			var msg = [];

			msg.push({
				name : leaf + ".datetime",
				value: measures.datetime,
				type : "Integer"
			});
			msg.push({
				name : leaf + ".new",
				value: 1,
				type : "Integer"
			});
			var hasMeasure = false;
			measures.measure.forEach( function( measure ) {
				if( symptoms[measure].rank ) {
					hasMeasure = true;
					var name = leaf + "scale["+symptoms[measure].ref+"]";
					msg.push({
						name : name + ".label",
						value: symptoms[measure].label[physioDOM.lang],
						type : "String"
					});
					msg.push({
						name : name + ".lastValue",
						value: 0,
						type : "Double"
					});
				}
			});
			if( hasMeasure ) {
				queue.postMsg(msg)
					.then(function () {
						resolve(msg);
					});
			} else {
				resolve([]);
			}
		});
	}

	this.dropSymptomsPlan = function() {
		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "]";
		var that = this;

		logger.trace("dropSymptomsPlan");
		return new promise( function(resolve, reject) {
			physioDOM.db.collection("agendaSymptoms").find({subject: that._id}).toArray(function (err, list) {
				var promises = list.map(function (Symptom) {
					var msg = [];
					msg.push({
						branch: name + ".Symptoms[" + Symptom.datetime + "]"
					});
					return queue.delMsg(msg);
				});
				RSVP.all(promises)
					.then(function() {
						physioDOM.db.collection("agendaSymptoms").drop( function(err, res) {
							resolve();
						});
					});
			});
		});
	};
	
	/**
	 * Get the symptoms plan and push it to the box
	 * 
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.getSymptomsPlan = function() {
		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "]";

		var today = moment().hour(12).minute(0).second(0);
		var endDate = moment().add(14,'d').hour(12).minute(0).second(0);
		var dataProg = new DataProg( this._id );
		var msgs = [];
		var that = this;

		return new promise( function(resolve, reject) {
			that.dropSymptomsPlan()
				.then( function() {
					return dataProg.getCategory("symptom");
				})
				.then(function (progs) {
					progs.forEach(function (prog) {
						var startDate, nextDate, firstDay, dat, closeDate;
						
						switch (prog.frequency) {
							case "daily":
								startDate = moment().subtract(prog.repeat, 'd');
								nextDate = moment(prog.startDate).hour(12).minute(0).second(0);
								closeDate = moment(prog.endDate).hour(12).minute(0).second(0);
								closeDate = closeDate.unix() < endDate.unix() ? closeDate:endDate;
								while (nextDate.unix() < startDate.unix()) {
									nextDate.add(prog.repeat, 'd');
								}
								if (nextDate.unix() <= closeDate.unix()) {
									do {
										if (nextDate.unix() <= closeDate.unix() && nextDate.unix() > today.unix()) {
											msgs.push({ref: prog.ref, date: nextDate.unix()});
										}
										nextDate.add(prog.repeat, 'd');
									} while (nextDate.unix() <= closeDate.unix());
								}
								break;
							case "weekly":
								startDate = moment().subtract(prog.repeat, 'w');
								nextDate = moment(prog.startDate).day(prog.when.days[0]).hour(12).minute(0).second(0);
								closeDate = moment(prog.endDate).hour(12).minute(0).second(0);
								closeDate = closeDate.unix() < endDate.unix() ? closeDate:endDate;
								while (nextDate.unix() < startDate.unix()) {
									nextDate.add(prog.repeat, 'w');
								}
								if (nextDate.unix() <= closeDate.unix()) {
									do {
										firstDay = moment.unix(nextDate.unix());
										prog.when.days.forEach(function (day) {
											firstDay.day(day);
											
											if (firstDay.unix() <= closeDate.unix() && firstDay.unix() > today.unix()) {
												msgs.push({ref: prog.ref, date: firstDay.unix()});
											}
										}); // jshint ignore:line
										nextDate.add(prog.repeat, 'w');
									} while (nextDate.unix() <= closeDate.unix());

								}
								break;
							case "monthly":
								startDate = moment().date(1).hour(12).minute(0).second(0);
								nextDate = moment(prog.startDate).date(1).hour(12).minute(0).second(0);
								closeDate = moment(prog.endDate).hour(12).minute(0).second(0);
								closeDate = closeDate.unix() < endDate.unix() ? closeDate:endDate;
								while (nextDate.unix() < startDate.unix()) {
									nextDate.add(prog.repeat, 'M');
								}
								
								if (nextDate.unix() <= closeDate.unix()) {
									prog.when.days.forEach(function (day) {
										if (day > 0) {
											dat = moment.unix(nextDate.unix());
											dat.day(day % 10);
											dat.add(Math.floor(day / 10) - 1, 'w');
										} else {
											dat = moment.unix(nextDate.unix()).add(1, 'M').subtract(1, 'd');
											dat.day(-day % 10);
											dat.subtract(Math.floor(-day / 10) - 1, 'w');
										}
										if (dat.unix() <= closeDate.unix() && dat.unix() > today.unix()) {
											msgs.push({ref: prog.ref, date: dat.unix()});
										}
									});
								}
								break;
						}
					});
					var results = {};
					msgs.forEach(function (msg) {
						if (results[msg.date]) {
							results[msg.date].measure.push(msg.ref);
						} else {
							results[msg.date] = { 
								datetime:msg.date, 
								measure: [msg.ref] ,
								date    : moment.unix(msg.date).toISOString()
							};
						}
					});
					var measures = [];
					for( var measure in results ) {
						measures.push( results[measure] );
					}
					// console.log( "symptoms",measures );
					physioDOM.Lists.getListItemsObj("symptom")
						.then(function (symptoms) {
							var promises = measures.map(function (measure) {
								return new promise(function (resolve, reject) {
									console.log(JSON.stringify(measure, "", 4));
									measure.subject = that._id;

									pushSymptom(queue, name + ".symptom[" + measure.datetime + "]", symptoms, measure)
										.then(function (msg) {
											if (msg.length) {
												physioDOM.db.collection("agendaSymptoms").save(measure, function (err, doc) {
													resolve(msg);
												});
											} else {
												resolve(msg);
											}
										});
								});
							});
							/*
							var promises = measures.map(function (measure) { 
								console.log("test");
								return pushSymptom(queue, name+".symptom["+measure.datetime+"]" , symptoms, measure);
							});
							*/
							RSVP.all(promises)
								.then(function (result) {
									console.log("fini");
									resolve(result);
								});
						});
				});
		});
		
	};
	
	function pushQuestionnaire(queue, name, quest, newFlag ) {
		return new promise( function(resolve,reject) {
			/*
			 questionnaires[id].label
			 questionnaires[id].new
			 questionnaires[id].scores[id].datetime
			 questionnaires[id].scores[id].value
			 */
			logger.trace("pushQuestionnaire",quest);
			
			var msg = [];
			if (quest.TVLabel ) {
				var leaf = name + ".questionnaires[" + quest.text + "]";
				
				queue.delMsg([ { branch : leaf } ])
					.then( function() {
						logger.trace("questionnare "+ quest.text +" cleared");
						
						msg.push({
							name: leaf + ".label",
							value: quest.TVLabel,
							type: "String"
						});
						msg.push({
							name: leaf + ".new",
							value: newFlag ? 1 : 0,
							type: "Integer"
						});
						for (var i = 0, l = quest.history.length; i < l; i++) {
							msg.push({
								name: leaf + ".values[" + i + "].datetime",
								value: moment(quest.history[i].datetime).unix(),
								type: "Integer"
							});
							msg.push({
								name: leaf + ".values[" + i + "].value",
								value: quest.history[i].value,
								type: "Double"
							});
						}
						queue.postMsg(msg)
							.then(function () {
								resolve(msg);
							});
					});
			} else {
				resolve(msg);
			}
		});
	}

	function pushParam( queue, name,  param ) {
		return new promise( function(resolve,reject) {
			/*
			 measuresHistory.params[id].label
			 measuresHistory.params[id].type
			 measuresHistory.params[id].precision
			 measuresHistory.params[id].unit
			 measuresHistory.params[id].values[id].datetime
			 measuresHistory.params[id].values[id].value
			 */
			
			var msg = [];
			if (param.rank) {
				var leaf = name + ".measuresHistory.params[" + param.text + "]";

				msg.push({
					name : leaf + ".label",
					value: param.name,
					type : "String"
				});
				msg.push({
					name : leaf + ".type",
					value: param.precision?"Double":"Integer",
					type : "Integer"
				});
				msg.push({
					name : leaf + ".precision",
					value: param.precision,
					type : "Integer"
				});
				msg.push({
					name : leaf + ".unit",
					value: param.unit,
					type : "String"
				});
				
				for (var i = 0, l = param.history.length; i < l; i++) {
					msg.push({
						name : leaf + ".values[" + i + "].datetime",
						value: moment(param.history[i].datetime).unix(),
						type : "Integer"
					});
					msg.push({
						name : leaf + ".values[" + i + "].value",
						value: param.history[i].value,
						type : "Double"
					});
				}
				queue.postMsg(msg)
					.then(function () {
						resolve(msg);
					});
			} else {
				resolve(msg);
			}
		});
	}

	function pushSymptomsHistory( queue, name, symptom ) {
		return new promise( function(resolve,reject) {
			/*
			 symptomsHistory.scales[id].label
			 symptomsHistory.scales[id].values[id].datetime
			 symptomsHistory.scales[id].values[id].value
			 */
			var msg = [];
			if (symptom.rank) {
				var leaf = name + ".symptomsHistory.scales[" + symptom.text + "]";

				msg.push({
					name : leaf + ".label",
					value: symptom.name,
					type : "String"
				});
				for (var i = 0, l = symptom.history.length; i < l; i++) {
					msg.push({
						name : leaf + ".values[" + i + "].datetime",
						value: moment(symptom.history[i].datetime).unix(),
						type : "Integer"
					});
					msg.push({
						name : leaf + ".values[" + i + "].value",
						value: symptom.history[i].value,
						type : "Double"
					});
				}
				queue.postMsg(msg)
					.then(function () {
						resolve(msg);
					});
			} else {
				resolve(msg);
			}
		});
	}

	/**
	 * Send a questionnaire history to the box
	 * only questionnaire that have a TVLabel are pushed
	 * 
	 * @param questionnaire
	 * @param newFlag
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.sendQuestionnaire = function( questionnaire, newFlag ) {
		var that = this;

		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "]";

		return new promise(function (resolve, reject) {
			var msgs = [];
			that.getHistoryDataList()
				.then(function (history) {
					var promises = history.questionnaire.map(function (quest) {
						return pushQuestionnaire(queue, name, quest);
					});
					RSVP.all(promises)
						.then(function (results) {
							logger.debug("questionnaire history pushed");
							resolve(msgs.concat(results));
						});
				});
		});
	};

	this.pushHistoryMeasures = function( history, queue, leaf ) {
		return new promise( function( resolve, reject) {
			var msgs = [];
			
			queue.delMsg([ { branch : leaf + ".measuresHistory"} ])
				.then(function () {
					logger.trace("symptomsHistory cleared");
					var promises = history["General"].map(function (param) {
						return pushParam(queue, leaf, param);
					});
					return RSVP.all(promises);
				})
				.then(function (results) {
					logger.debug("General history pushed");
					msgs = msgs.concat(results);
					logger.info("msgs", msgs);
					var promises = history["HDIM"].map(function (param) {
						return pushParam(queue, leaf, param);
					});
					return RSVP.all(promises);
				})
				.then(function (results) {
					logger.debug("HDIM history pushed");
					msgs = msgs.concat(results);
					resolve(msgs);
				});
		});
	};

	this.pushHistorySymptoms = function( history, queue, leaf ) {
		logger.trace("pushHistorySymptoms");
		
		return new promise( function( resolve, reject) {
			var msgs = [];
			
			queue.delMsg([ { branch : leaf + ".symptomsHistory"} ])
				.then(function () {
					logger.trace("symptoms history cleared");
					var promises = history.symptom.map(function (param) {
						return pushSymptomsHistory(queue, leaf, param);
					});
					return RSVP.all(promises);
				})
				.then(function (results) {
					logger.debug("symptom history pushed");
					msgs = msgs.concat(results);
					resolve(msgs);
				});
		});
	};

	this.pushHistoryQuestionnaires = function( history, queue, leaf ) {
		return new promise( function( resolve, reject) {
			var msgs = [];

			var promises = history.questionnaire.map(function (param) {
				return pushQuestionnaire(queue, leaf, param);
			});
			RSVP.all(promises)
				.then(function (results) {
					msgs = msgs.concat(results);
					resolve(msgs);
				});
		});
	};
	
	/**
	 * push measures history ( the last 5 measures of each parameters ) to the box
	 * 
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.pushHistory = function( category ) {
		var that = this;
		
		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "]";
		
		return new promise(function (resolve, reject) {
			var msgs = [];
			that.getHistoryDataList()
				.then(function (history) {
					switch( category ) {
						case "measures":
							logger.trace("pushHistory measures");
							that.pushHistoryMeasures( history, queue, name )
								.then( resolve );
							break;
						case "symptoms":
							logger.trace("pushHistory symptoms");
							that.pushHistorySymptoms( history, queue, name )
								.then( resolve );
							break;
						case "questionnaires":
							logger.trace("pushHistory questionnaires");
							that.pushHistoryQuestionnaires( history, queue, name )
								.then( resolve );
							break;
						default:
							logger.trace("pushHistory all");
							that.pushHistoryMeasures( history, queue, name )
								.then( function( results ) {
									msgs = msgs.concat(results);
									return that.pushHistorySymptoms( history, queue, name );
								})
								.then( function( results ) {
									msgs = msgs.concat(results);
									return that.pushHistoryQuestionnaires( history, queue, name );
								})
								.then( function( results ) {
									msgs = msgs.concat(results);
									logger.info("msgs", msgs);
									resolve( msgs );
								})
								.catch( function(err) {
									logger.warning(err);
									reject( err );
								});
					}
				});
		});
	};

	/**
	 * Push the last DHD-FFQ (Eetscore) to the box
	 * 
	 * @param newFlag
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|l|Dn}
	 */
	this.pushLastDHDFFQ = function( newFlag ) {
		var that = this;
		var queue = new Queue(this._id);
		var leaf = "hhr[" + this._id + "].dhdffq";
		
		logger.trace("pushLastDHDFFQ");
		return new promise( function(resolve, reject) {
			var search = { category: "questionnaire", text: "DHD-FFQ", subject: that._id };
			physioDOM.db.collection("dataRecordItems").find(search).sort({datetime: -1}).limit(1).toArray(function (err, quests) {
				console.log(quests[0]);
				if (quests.length) {
					console.log( "Lang", physioDOM.lang );
					var Questionnaire = require("./questionnaire.js");
					var QuestionnaireAnswer = require("./questionnaireAnswer.js");
					var questionnaire = new Questionnaire();
					var answer = new QuestionnaireAnswer();
					questionnaire.getByRef("DHD-FFQ")
						.then( function(questionnaire) {
							answer.getById(new ObjectID(quests[0].ref))
								.then(function (answer) {
									/*
									dhdffq.advice
									dhdffq.new
									dhdffq.subscores[id].label
									dhdffq.subscores[id].value%
									*/
									var msg = [];

									msg.push({
										name : leaf + ".advice",
										value: quests[0].comment,
										type : "String"
									});
									msg.push({
										name : leaf + ".new",
										value: newFlag?1:0,
										type : "Integer"
									});
									for( var i= 0, l=answer.questions.length; i<l;i++) {
										msg.push({
											name : leaf + ".subscore["+i+"].label",
											value: questionnaire.questions[i].label[physioDOM.lang],
											type : "String"
										});
										msg.push({
											name : leaf + ".subscore["+i+"].value",
											value: answer.questions[i].choice,
											type : "Integer"
										});
									}
									queue.postMsg(msg)
										.then(function () {
											resolve(msg);
										});
								})
								.catch(function (err) {
									logger.error("cant get the answer");
									resolve(false);
								});
						});
				} else {
					resolve(false);
				}
			});
		});
	};

	/**
	 * Push a physical recommandation to the queue
	 * 
	 * @param {physicalPlan} physicalPlan
	 * @param {boolean} newFlag
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|Dn}
	 */
	this.pushPhysicalPlanToQueue = function( physicalPlan, newFlag ) {
		logger.trace("pushPhysicalPlanToQueue");

		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "].physical";

		return new promise(function (resolve, reject) {
			/*
			 physical.new
			 physical.history[id].datetime
			 physical.history[id].description
			 */
			var msg = [];
			if( newFlag ) {
				msg.push({
					name : name + ".new",
					value: 1,
					type : "Integer"
				});
			}
			msg.push({
				name : name + ".history["+physicalPlan._id+"].datetime",
				value: moment(physicalPlan.datetime).unix(),
				type : "Integer"
			});
			msg.push({
				name : name + ".history["+physicalPlan._id+"].description",
				value: physicalPlan.content,
				type : "String"
			});
			queue.postMsg(msg)
				.then(function () {
					resolve(msg);
				});
		});
	};

	/**
	 * push the whole physical plan and history to the queue
	 * 
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|Dn}
	 */
	this.physicalPlanToQueue = function() {
		var that = this;

		return new promise(function (resolve, reject) {
			var physicalPlan = new PhysicalPlan(that._id);
			physicalPlan.getItemsArray(1, 1000)
				.then( function(results) {
					var promises = results.map( function( physicalPlan) {
						return that.pushPhysicalPlanToQueue(physicalPlan);
					});
					RSVP.all(promises)
						.then( function( results) {
							resolve( [].concat(results) );
						});
				});
		});
	};

	/**
	 * Push a dietary advice to the BOX
	 * 
	 * @param {dietaryPlan} dietaryPlan the recommandation to send
	 * @param {boolean} newFlag  set to true if it's a new advice
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|Dn}
	 */
	this.pushDietaryPlanToQueue = function( dietaryPlan, newFlag ) {
		logger.trace("pushDietaryPlanToQueue");
		logger.debug(dietaryPlan);

		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "].dietary";
		
		return new promise(function (resolve, reject) {
			/*
			 dietary.recommendations.new
			 dietary.recommendations.history[id].datetime
			 dietary.recommendations.history[id].description
			 */
			var msg = [];
			if( newFlag ) {
				msg.push({
					name : name + ".new",
					value: 1,
					type : "Integer"
				});
			}
			msg.push({
				name : name + ".recommendations.history["+dietaryPlan._id+"].datetime",
				value: moment(dietaryPlan.datetime).unix(),
				type : "Integer"
			});
			msg.push({
				name : name + ".recommendations.history["+dietaryPlan._id+"].description",
				value: dietaryPlan.content,
				type : "String"
			});
			logger.debug("msg to send", msg );
			queue.postMsg(msg)
				.then(function () {
					resolve(msg);
				});
		});
	};

	/**
	 * Push the whole dietary plan to the queue
	 * 
	 * @returns {$$rsvp$promise$$default|RSVP.Promise|*|Dn}
	 */
	this.dietaryPlanToQueue = function() {
		var that = this;

		return new promise(function (resolve, reject) {
			var dietaryPlan = new DietaryPlan( that._id );
			dietaryPlan.getItemsArray(1, 1000)
				.then( function(results) {
					var promises = results.map( function( dietaryPlan) {
						return that.pushDietaryPlanToQueue(dietaryPlan);
					});
					RSVP.all(promises)
						.then( function( results) {
							resolve([].concat(results));
						});
				});
		});
	};
	
	this.pushFirstName = function() {
		var that = this;

		var queue = new Queue(this._id);
		var name = "hhr[" + this._id + "].firstName";
		return new promise(function (resolve, reject) {
			var msg = [];
			msg.push({
				name : name,
				value: that.name.given || that.name.familly,
				type : "String"
			});
			queue.postMsg(msg)
				.then(function () {
					resolve(msg);
				});
		});
	};
	
	this.pushMessages = function() {
		var messages = new Messages(this._id);
		return messages.pushMessages();
	};
}

module.exports = Beneficiary;
