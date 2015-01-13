/* jslint node:true */
'use strict';

var currentWellBeingSchema = {
	"allOf": [
		{ "$ref": "/CurrentStatus" },
		{
			"properties": {
				"name": {
					type: "string",
					enum: ["well"],
					required: true
				},
				"sf12Score": {
					type: "integer",
					default: 0,
					description: "SF12 questionnaire score"
				},
				"sf12Date": {
					type: "date",
					description: "SF12 questionnaire date"
				},
				"sf12Answer": {
					type: "string",
					description: "SF12 questionnaire answer ID"
				}
			},
			"required": ["name"]
		}
	]
};

var currentActivitySchema = {
	"allOf": [
		{ "$ref": "/CurrentStatus" },
		{
			"properties": {
				"name": {
					type: "string",
					enum: ["activity"]
				},
				"stepsCheck": {
					type: "boolean",
					default: false,
					description: ""
				},
				"stepsNumber": {
					type: "integer",
					description: "Number of steps per week"
				},
				"required": ["name"]
			}
		}
	]
};

var currentStatusSchema = {
	id: "/CurrentStatus",
	type: "object",
	title: "Current Status",
	description : "Current Status JSON Schema",
	"properties": {
		"_id": {
			type: "object"
		},
		"subject": {
			type: "object",
			description: "beneficiary Object ID",
			required: true
		},
		"validated": {
			type: "boolean",
			description: "this group of data has been validated",
			required: false
		},
	},
	"required": ["subject"]
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(currentStatusSchema, '/CurrentStatus');
validator.addSchema(currentWellBeingSchema, '/well');
validator.addSchema(currentActivitySchema, '/activity');

module.exports.validator = validator;