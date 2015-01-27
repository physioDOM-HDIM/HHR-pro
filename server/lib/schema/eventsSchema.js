/* jslint node:true */
'use strict';

var eventsSchema = {
	id: "/Events",
	type: "object",
	title: "Event item",
	description : "Event item JSON Schema",
	properties: {
		"_id":      { type: "object" },
		"ref": 		{ type: "object" },
		"datetime": { type: "string", format: "date-time", required: true},
		"service":  { type: "string", enum: ["Message", "Health status", "Data record","Beneficiary"] , required: true },
		"operation":{ type: "string", enum: ["create", "update", "overtake"] , required: true },
		"subject": { type:"object", description:"beneficiary ID" }
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(eventsSchema, '/Events');

module.exports.validator = validator;