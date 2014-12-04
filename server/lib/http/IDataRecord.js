/**
 * @file IDataRecord.js
 * @module Http
 */

/* jslint node:true */
"use strict";

var Logger = require("logger");
var logger = new Logger("IDataRecord");

/**
 * IDataRecord
 *
 * treat http request for dataRecord
 */
var IDataRecord = {

	/**
	 * get list of dataRecord
	 *
	 * Nota : Session must exists
	 */
	getList: function(req, res, next) {
		logger.trace("getDataRecord");
		// logger.debug(req.session?"session "+ JSON.stringify(req.session,null,4) : "no session");

		//MOCK TODO
		var mock = {
			"nb": 34,
			"pg": 1,
			"offset": 10,
			"items": [{
				"dataRecordID": '54646563234653232345363',
				"subject": {
					"_id": "545516ebf39cfb150625df02",
					"name": {
						"family": "Amendola",
						"given": "Tony"
					}
				},
				"source": {
					"_id": "53fb2763b3371800000d42e0",
					"name": {
						"family": "Archer",
						"given": "Claire"
					}
				},
				"datetime": "2015-06-17",
				"home": true
			}, {
				"dataRecordID": '54646563234653232345363',
				"subject": {
					"_id": "545516ebf39cfb150625df02",
					"name": {
						"family": "Amendola",
						"given": "Tony"
					}
				},
				"source": {
					"_id": "53fb2763b3371800000d42e0",
					"name": {
						"family": "Archer",
						"given": "Claire"
					}
				},
				"datetime": "2015-06-17",
				"home": false
			}, {
				"dataRecordID": '54646563234653232345363',
				"subject": {
					"_id": "545516ebf39cfb150625df02",
					"name": {
						"family": "Amendola",
						"given": "Tony"
					}
				},
				"source": {
					"_id": "53fb2763b3371800000d42e0",
					"name": {
						"family": "Archer",
						"given": "Claire"
					}
				},
				"datetime": "2015-06-17",
				"home": true
			}, {
				"dataRecordID": '54646563234653232345363',
				"subject": {
					"_id": "545516ebf39cfb150625df02",
					"name": {
						"family": "Amendola",
						"given": "Tony"
					}
				},
				"source": {
					"_id": "53fb2763b3371800000d42e0",
					"name": {
						"family": "Archer",
						"given": "Claire"
					}
				},
				"datetime": "2015-06-17",
				"home": true
			}]
		};

		res.send(mock);
	},

	/**
	 * get a dataRecord
	 *
	 * Nota : Session must exists
	 */
	getById: function(req, res, next) {
		logger.trace("getDataRecord");
		// logger.debug(req.session?"session "+ JSON.stringify(req.session,null,4) : "no session");

		// if(req.param)
		//MOCK TODO
		var mock = {
			"dataRecordID": '54646563234653232345363',
			"subject": {
				"_id": "545516ebf39cfb150625df02",
				"name": {
					"family": "Amendola",
					"given": "Tony"
				}
			},
			"source": {
				"_id": "53fb2763b3371800000d42e0",
				"name": {
					"family": "Archer",
					"given": "Claire"
				}
			},
			"datetime": "2015-06-17",
			"home": true
		};

		res.send(mock);
	}

};

module.exports = IDataRecord;