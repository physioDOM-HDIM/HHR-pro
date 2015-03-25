/**
 * @file IBeneficiary.js
 * @module Http
 */

/* jslint node:true */
"use strict";

var Logger = require("logger"),
	ObjectID = require("mongodb").ObjectID,
	DataRecords = require("../class/dataRecords"),
	RSVP = require("rsvp"),
	promise = require("rsvp").Promise;
var CurrentStatus = require('../class/currentStatus');
var logger = new Logger("IBeneficiary");

/**
 * IBeneficiaries
 *
 * treat http request for beneficiaries
 */
var IBeneficiary = {

	/**
	 * get list of beneficiaries
	 * 
	 * Nota : Session must exists
	 */
	getBeneficiaries : function( req, res, next ) {
		logger.trace("getBeneficiaries");
		// logger.debug(req.session?"session "+ JSON.stringify(req.session,null,4) : "no session");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;

		// console.log(req.Session);
		physioDOM.Beneficiaries()
			.then(function(beneficiaries) {
				return beneficiaries.getBeneficiaries(req.session, pg, offset, sort, sortDir, filter);
			})
			.then( function(list) {
				res.send(list);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * get the list of HHR ( beneficiaries that have an assigned box and are active
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getHHRs : function(req, res, next) {
		logger.trace("getBeneficiaries");
		// logger.debug(req.session?"session "+ JSON.stringify(req.session,null,4) : "no session");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;

		if( ["administrator","coordinator"].indexOf(req.session.role) === -1 ) {
			res.send(403, { code:403, message:"you have no write to access this request"});
			next(false);
		} else {
			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					return beneficiaries.getAllActiveHHRList(pg, offset);
				})
				.then(function (list) {
					list.items.forEach(function (item, i) {
						var tmp = {};
						tmp._id = item._id;
						tmp.biomaster = item.biomaster;
						tmp.biomasterStatus = item.biomasterStatus;
						tmp.beneficiary = item.name.family + " " + item.name.given;
						list.items[i] = tmp;
					});
					res.send(list);
					next();
				})
				.catch(function (err) {
					res.send(err.code || 400, err);
					next(false);
				});
		}
	},
	
	createBeneficiary: function(req, res, next ) {
		logger.trace("createBeneficiary");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				if(!req.body) {
					throw( {"message":"entry is empty"});
				}
				try {
					var user = JSON.parse(req.body.toString());
					return beneficiaries.createBeneficiary(req.session, user);
				} catch(err) {
					throw { code:405, message:"bad json format"};
				}
			})
			.then( function(beneficiary) {
				res.send(beneficiary);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getBeneficiary: function(req, res, next) {
		logger.trace("getBeneficiary");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				/*
				if( req.params.entryID ) {
					logger.debug("add beneficiary to session");
					req.session.beneficiary = new ObjectID(req.params.entryID);
					req.session.save();
				}
				*/
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, new ObjectID(req.params.entryID) || req.session.beneficiary  );
				}
			})
			.then( function(beneficiary) {
				res.send( beneficiary );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	updateBeneficiary: function(req, res, next) {
		logger.trace("updateBeneficiary");
		if(!req.body) {
			res.send(400, { error: "empty request"});
			return next(false);
		}

		try {
			var updateItem = JSON.parse(req.body);

			physioDOM.Beneficiaries()
				.then(function (beneficiaries) {
					if( req.session.role === "beneficiary") {
						return beneficiaries.getHHR(req.session.beneficiary );
					} else {
						return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID );
					}
				})
				.then(function (beneficiary) {

					beneficiary.hasProfessional(req.session.person.id)
						.then(function(hasProfessional) {
							if(hasProfessional || ["administrator","coordinator"].indexOf(req.session.role) !== -1) {
								return beneficiary.update(updateItem, req.session.person.id);
							} else {
								throw { code:403, message:"not authorized"};
							}
						});

				})
				.then( function (beneficiary ) {
					res.send( beneficiary );
					next();
				})
				.catch(function (err) {
					res.send(err.code || 400, err);
					next(false);
				});
		} catch( err ) {
			res.send(err.code || 400, err);
			next(false);
		}
	},

	deleteBeneficiary: function(req, res, next) {
		logger.trace("deleteBeneficiary");
		var beneficiaries;
		
		physioDOM.Beneficiaries()
			.then( function( _beneficiaries) {
				beneficiaries = _beneficiaries;
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID );
				}
			})
			.then( function(beneficiary) {

				beneficiary.hasProfessional(req.session.person.id)
					.then(function(hasProfessional) {
						if(hasProfessional || ["administrator","coordinator"].indexOf(req.session.role) !== -1) {
							return beneficiaries.deleteBeneficiary(beneficiary);
						} else {
							throw { code:403, message:"not authorized"};
						}
					});

			})
			.then( function() {
				res.send(410, { code:410, message: "entry deleted"});
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	beneficiaryProfessionals: function(req, res, next) {
		logger.trace("beneficiaryProfessonnals");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(beneficiary) {
				return beneficiary.getProfessionals( pg, offset );
			})
			.then( function( professionals ) {
				res.send( professionals );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	beneficiaryAddProfessional: function(req, res, next) {
		logger.trace("beneficiaryAddProfessonnal");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID );
				}
			}).then( function(beneficiary) {
				logger.debug("get beneficiary");
				var item;
				try {
					item = JSON.parse(req.body);
					if( Array.isArray(item)) {
						return beneficiary.addProfessionals(item);
					} else {
						return beneficiary.addProfessional(item.professionalID, item.referent);
					}
				} catch( err ) {
					var error = err;
					if(!error) {
						error = { code:405, message:"bad format"};
					}
					res.send(error.code || 400, error);
					next(false);
				}
			})
			.then( function(professionals) {
				res.send( professionals );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	beneficiaryDelProfessional: function(req, res, next) {
		logger.trace("beneficiaryDelProfessonnal");
		physioDOM.Beneficiaries()
			.then( function(beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID );
				}
			}).then( function(beneficiary) {
				return beneficiary.delProfessional(req.params.profID);
			})
			.then( function(professionals) {
				res.send( professionals );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * return the list of dataRecords of the selected beneficiary
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	dataRecords: function(req,res, next) {
		logger.trace("datarecords");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getDataRecords(pg, offset, sort, sortDir, filter);
			})
			.then( function (datarecords) {
				res.send( datarecords );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * get the detail of a dataRecord
	 * the requested dataRecord is given in the url : '/api/beneficiary/datarecords/:dataRecordID'
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	dataRecord: function(req,res,next) {
		logger.trace("datarecord", req.params.dataRecordID );
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getCompleteDataRecordByID(req.params.dataRecordID);
			})
			.then( function (datarecord) {
				res.send( datarecord );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Create a new data record
	 * 
	 * The data record could have some value, the data record is read from the body of the POST request
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	newDataRecord: function(req,res, next) {
		logger.trace("newDataRecord");
		
		var beneficiary, dataRecord;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiaryRes) {
				beneficiary = beneficiaryRes;
				var dataRecord = JSON.parse( req.body );
				return beneficiary.createDataRecord( dataRecord, req.session.person.id );
			})
			.then( function( result ) {
				dataRecord = result;
				res.send( dataRecord );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Update a data record
	 * 
	 * The whole data record with all his value is read from the body of the request.
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	updateDataRecord: function(req, res, next) {
		logger.trace("updateDataRecord");
		var beneficiary;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiaryObj) {
				beneficiary = beneficiaryObj;
				return beneficiary.getDataRecordByID(req.params.dataRecordID);
			})
			.then( function(dataRecord) {
				var items = JSON.parse(req.body);
				return dataRecord.updateItems(items);
			})
			.then( function( dataRecord ) {
				return dataRecord.getComplete();
			})
			.then(function( completeDataRecord ) {
				res.send(completeDataRecord);
				logger.trace(completeDataRecord._id, req.session.person.id);
				return beneficiary.createEvent('Data record', 'update', new ObjectID(completeDataRecord._id), req.session.person.id);
			})
			.then( function() {
				return beneficiary.pushLastDHDFFQ();
			})
			.then( function() {
				return beneficiary.pushHistory();
			})
			.then(function() {
				next();
			})
			.catch( function(err) {
				console.log( err );
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * remove a data record
	 *
	 * The whole data record with all his value is read from the body of the request.
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	removeDataRecord: function(req, res, next) {
		logger.trace("deleteDataRecord");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiaryObj) {
				beneficiary = beneficiaryObj;
				return beneficiary.deleteDataRecordByID(req.params.dataRecordID);
			})
			.then(function( nb ) {
				res.send( 200, { code:200, message:"Datarecord removed"} );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Get the list of threshold limits for the current beneficiary
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getThreshold: function( req, res, next ) {
		logger.trace("getThreshold");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getThreshold();
			})
			.then( function (thresholds) {
				res.send( thresholds );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Modify the threshold limits for one or many parameters
	 * The api will send back the full list of threshold limits after modification
	 * 
	 * The modified list is send in the body of a post request
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	setThreshold: function( req, res, next ) {
		logger.trace("setThreshold");
		var beneficiary,updateItems;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				updateItems = JSON.parse(req.body);
				return beneficiary.setThresholds( updateItems );
			})
			.then( function (thresholds) {
				res.send( thresholds );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Get the list of messages to home
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getMessages: function(req, res, next) {
		logger.trace("getMessages");
		var beneficiary;

		var pg      = parseInt(req.params.pg,10) || 1;
		var offset  = parseInt(req.params.offset,10) || 25;
		var sort    = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter  = req.params.filter || null;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.getMessages( pg, offset, sort, sortDir, filter );
			})
			.then( function (messages) {
				res.send( messages );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	createMessage : function(req, res, next) {
		logger.trace("createMessage");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				try {
					var msg = JSON.parse( req.body );
					return beneficiary.createMessage( req.session, msg );
				} catch( err ) {
					throw { code:405, message: "message is not a JSON object"};
				}
				
			})
			.then( function (message) {
				res.send( message );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Get the list of parameters that could be displayed on graph
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getGraphDataList: function( req, res, next) {
		logger.trace("getGraphDataList");

		var beneficiary;
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.getGraphDataList( req.session.lang || physioDOM.lang );
			}).then( function( graphList) {
				res.send(graphList);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Get the list of parameters with the last 5 measurements
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	getHistoryDataList: function( req, res, next) {
		logger.trace("getHistoryDataList");

		var beneficiary;
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.getHistoryDataList( req.session.lang || physioDOM.lang );
			}).then( function( graphList) {
				res.send(graphList);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	/**
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	getGraphData: function( req, res, next ) {
		logger.trace("getGraphData");

		var beneficiary;
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.getGraphData(req.params.category, req.params.paramName, req.params.start, req.params.stop, req.session);
			}).then( function( graphData) {
				res.send(graphData);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getDataProg: function( req, res, next) {
		logger.trace("getDataProg");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				res.send({code: 501, message: "not yet implemented"});
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Get the array of prescription measurements for one category
	 * the category is declared in the url `/api/beneficiary/dataprog/:category`
	 * 
	 * category are "General","HDIM","symptom","questionnaire"
	 *
	 * @param req
	 * @param res
	 * @param next
	 */
	getDataProgCategory: function( req, res, next) {
		logger.trace("getDataProgCategory");
		var beneficiary;
		
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.getDataProgCategory( req.params.category );
			})
			.then( function( prescriptions ) {
				res.send(prescriptions);
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Add a new data prescription to the selected beneficiary
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	setDataProg: function( req, res, next) {
		logger.trace("getDataProgCategory");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.setDataProg( JSON.parse(req.body) );
			})
			.then( function( prescription ) {
				res.send(prescription);
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Delete a existing data prescription
	 * 
	 * the selected prescription is given by the url : `/api/beneficiary/dataprog/:dataProgItemID`
	 * 
	 * on success send a 200 HTTP code, else send a 4xx HTTP Code
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	removeDataProg: function( req, res, next ) {
		logger.trace("removeDataProg");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.delDataProg( req.params.dataProgItemID );
			})
			.then( function( done ) {
				res.send(200, { err: 200, message: "item successfully deleted"});
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getQuestProg: function( req, res, next) {
		logger.trace("getQuestProg");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.questionnairePlan( );
			})
			.then( function( questionnairePlan) {
				return questionnairePlan.getList(req.session.lang);
			})
			.then( function( prescriptions ) {
				res.send(prescriptions);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},
	
	addQuestProg: function( req, res, next) {
		logger.trace("addQuestProg");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.questionnairePlan( );
			})
			.then( function( questionnairePlan ) {
				return questionnairePlan.addDate( req.params.ref, JSON.parse(req.body) );
			})
			.then( function( prescription ) {
				res.send(prescription);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	delQuestProg: function( req, res, next) {
		logger.trace("delQuestProg");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.questionnairePlan( );
			})
			.then( function( questionnairePlan ) {
				return questionnairePlan.delDate( req.params.ref, JSON.parse(req.body) );
			})
			.then( function( prescription ) {
				res.send(prescription);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	setQuestProg: function( req, res, next) {
		logger.trace("setQuestProg");
		var beneficiary;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then( function(selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return beneficiary.questionnairePlan( );
			})
			.then( function( questionnairePlan ) {
				return questionnairePlan.setQuestionnaire( JSON.parse(req.body) );
			})
			.then( function( prescription ) {
				res.send(prescription);
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Create questionnaire answers.
	 * 
	 * the selected prescription is given by the url : `/api/beneficiary/dataprog/:dataProgItemID`
	 * 
	 * on success send a 200 HTTP code, else send a 4xx HTTP Code
	 * 
	 * @param req
	 * @param res
	 * @param next
	 */
	createQuestionnaireAnswers: function(req, res, next) {
		logger.trace('createQuestionnaireAnswers');
		var beneficiary;
		var questionnaireID = req.params.entryID;
		var questionnaire;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.session.beneficiary);
				}
			})
			.then(function (selectedBeneficiary) {
				beneficiary = selectedBeneficiary;
				return physioDOM.Questionnaires();
			})
			.then (function(questionnaires) {
				return questionnaires.getQuestionnaireByID(questionnaireID);
			})
			.then (function(selectedQuestionnaire) {
				questionnaire = selectedQuestionnaire;
				return physioDOM.QuestionnaireAnswer();
			})
			.then (function(questionnaireAnswer) {
				var entry = JSON.parse(req.body);
				entry.subject = beneficiary._id;
				entry.ref = questionnaire._id;
				entry.datetime = new Date();
				return questionnaireAnswer.create(entry);
			})
			.then (function(answer) {
				return new CurrentStatus().saveAnswer(beneficiary._id, questionnaire.name, answer);
			})
			.then (function(answer) {
				res.send(answer);
				next();
			})
			.catch(function (err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Adding a new dietary plan to replace the old one
	 * @param req
	 * @param res
	 * @param next
	 */

	createDietaryPlan: function(req,res, next) {
		logger.trace("newDietaryPlan");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				var dietaryPlan = JSON.parse( req.body );
				return beneficiary.createDietaryPlan( dietaryPlan, req.session.person.id );
			})
			.then( function( dietaryPlan) {
				res.send( dietaryPlan );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getDietaryPlan: function(req,res,next) {
		logger.trace("dietaryPlan");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getDietaryPlan();
			})
			.then( function (dietaryPlan) {
				res.send( dietaryPlan );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getDietaryPlanList: function(req,res, next) {
		logger.trace("dietaryPlanList");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getDietaryPlanList(pg, offset, sort, sortDir, filter);
			})
			.then( function (dietaryPlanList) {
				res.send( dietaryPlanList );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	/**
	 * Adding a new physical plan to replace the old one
	 * @param req
	 * @param res
	 * @param next
	 */

	createPhysicalPlan: function(req,res, next) {
		logger.trace("newPhysicalPlan");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				var physicalPlan = JSON.parse( req.body );
				return beneficiary.createPhysicalPlan( physicalPlan, req.session.person.id );
			})
			.then( function( physicalPlan) {
				res.send( physicalPlan );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getPhysicalPlan: function(req,res,next) {
		logger.trace("physicalPlan");
		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getPhysicalPlan();
			})
			.then( function (physicalPlan) {
				res.send( physicalPlan );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getPhysicalPlanList: function(req,res, next) {
		logger.trace("physicalPlanList");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getPhysicalPlanList(pg, offset, sort, sortDir, filter);
			})
			.then( function (physicalPlanList) {
				res.send( physicalPlanList );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	},

	getEventList: function(req,res, next) {
		logger.trace("eventList");
		var pg = parseInt(req.params.pg,10) || 1;
		var offset = parseInt(req.params.offset,10) || 20;
		var sort = req.params.sort || null;
		var sortDir = parseInt(req.params.dir,10) || 1;
		var filter = req.params.filter || null;

		physioDOM.Beneficiaries()
			.then(function (beneficiaries) {
				if( req.session.role === "beneficiary") {
					return beneficiaries.getHHR(req.session.beneficiary );
				} else {
					return beneficiaries.getBeneficiaryByID(req.session, req.params.entryID || req.session.beneficiary);
				}
			})
			.then(function (beneficiary) {
				return beneficiary.getEventList(pg, offset, sort, sortDir, filter);
			})
			.then( function (eventList) {
				res.send( eventList );
				next();
			})
			.catch( function(err) {
				res.send(err.code || 400, err);
				next(false);
			});
	}
};

module.exports = IBeneficiary;
