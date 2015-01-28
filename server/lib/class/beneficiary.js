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
	this.getProfessionals = function() {
		var that = this;
		if( that.professionals === undefined ) {
			that.professionals = [];
		}
		return new promise( function(resolve, reject) {
			logger.trace("getProfessionals");
			var count = that.professionals.length;
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
							})
							.then( function() {
								if( --count === 0) {
									resolve( that.professionals );
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
			})
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
							console.log("professional found");
							indx = i;
						}
					});
					console.log("indx", indx);
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
		var datarecord, that = this;
		
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
		var datarecord, that = this;

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
			logger.trace("createDataRecord");
			var dataRecord = new DataRecord();
			dataRecord.setup(that._id, dataRecordObj, professionalID)
				.then(function (dataRecord) {
					return that.createEvent('Data record', 'create', dataRecord._id, professionalID)
						.then( function() {
							return that.getCompleteDataRecordByID(dataRecord._id);
						});
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
							console.log("test ", Object.keys(updatedThresholds[prop]));
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
				return physioDOM.Lists.getListArray(listName , lang );
			});
			
			var thresholds;
			that.getThreshold()
				.then( function(_thresholds) {
					thresholds = _thresholds;
					return physioDOM.Lists.getList("units")
				})
				.then(function (units) {
					RSVP.all(promises).then(function (lists) {
						var labels = {};
						for (var i = 0; i < lists.length; i++) {
							for (var prop in lists[i].items) {
								labels[prop] = lists[i].items[prop];
							}
						}

						physioDOM.db.collection("dataRecordItems").group(groupRequest.key, groupRequest.cond, groupRequest.initial, groupRequest.reduce, function (err, results) {
							if (err) {
								reject(err);
							} else {
								RSVP.all( results.map(function (result) {
											result.name = labels[result.text] || result.text;
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

}

module.exports = Beneficiary;
