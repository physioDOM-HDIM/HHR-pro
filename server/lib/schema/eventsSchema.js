/* jslint node:true */
'use strict';

var eventService = [ 
	"Dietary plan",
	"Physical plan",
	"Message", 
	"Health status", 
	"Health status : well",
	"Health status : activity", 
	"Health status : nutrition", 
	"Health status : frailty", 
	"Data record",
	"Beneficiary"
];

var eventsSchema = {
	id: "/Events",
	type: "object",
	title: "Event item",
	description : "Event item JSON Schema",
	properties: {
		"_id":      { type: "object" },
		"ref": 		{ type: "object" },
		"sender": 	{ type: "object" },
		"datetime": { type: "string", format: "date-time", required: true},
		"service":  { type: "string", enum: eventService , required: true },
		"operation":{ type: "string", enum: ["create", "update", "overtake"] , required: true },
		"subject": { type:"object", description:"beneficiary ID" }
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(eventsSchema, '/Events');

module.exports.validator = validator;