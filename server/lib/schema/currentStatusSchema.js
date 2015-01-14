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

var currentNutritionSchema = {
	"allOf": [
		{ "$ref": "/CurrentStatus" },
		{
			"properties": {
				"name": {
					type: "string",
					enum: ["nutrition"]
				},
				"size": {
					type: "number",
					description: "Size"
				},
				"weight": {
					type: "number",
					description: "Weight"
				},
				"lean": {
					type: "number",
					description: "Lean/fat ratio"
				},
				"bmi": {
					type: "number",
					description: "BMI"
				},
				"mnaScore": {
					type: "integer",
					default: 0,
					description: "MNA questionnaire score"
				},
				"mnaDate": {
					type: "date",
					description: "MNA questionnaire date"
				},
				"mnaAnswer": {
					type: "string",
					description: "MNA questionnaire answer ID"
				},
				"mnaSfScore": {
					type: "integer",
					default: 0,
					description: "MNA SF questionnaire score"
				},
				"mnaSfDate": {
					type: "date",
					description: "MNA SF questionnaire date"
				},
				"mnaSfAnswer": {
					type: "string",
					description: "MNA SF questionnaire answer ID"
				},
				"snaqScore": {
					type: "integer",
					default: 0,
					description: "SNAQ questionnaire score"
				},
				"snaqDate": {
					type: "date",
					description: "SNAQ questionnaire date"
				},
				"snaqAnswer": {
					type: "string",
					description: "SNAQ questionnaire answer ID"
				},
				"dhdScore": {
					type: "integer",
					default: 0,
					description: "DHD-FFQ questionnaire score"
				},
				"dhdDate": {
					type: "date",
					description: "DHD-FFQ questionnaire date"
				},
				"dhdAnswer": {
					type: "string",
					description: "DHD-FFQ questionnaire answer ID"
				},
				"dietPresc": {
					type: "string",
					description: "Special diet prescriptions"
				},
				"required": ["name"]
			}
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

var currentFrailtySchema = {
	"allOf": [
		{ "$ref": "/CurrentStatus" },
		{
			"properties": {
				"name": {
					type: "string",
					enum: ["frailty"]
				},
				"chairStandScore": {
					type: "integer",
					default: 0,
					description: "Chair stand questionnaire score"
				},
				"chairStandDate": {
					type: "date",
					description: "Chair stand questionnaire date"
				},
				"chairStandAnswer": {
					type: "string",
					description: "Chair stand questionnaire answer ID"
				},
				"normal": {
					type: "boolean",
					default: false,
					description: "Normal"
				},
				"risk": {
					type: "boolean",
					default: false,
					description: "Risk of fail"
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
validator.addSchema(currentNutritionSchema, '/nutrition');
validator.addSchema(currentActivitySchema, '/activity');
validator.addSchema(currentFrailtySchema, '/frailty');

module.exports.validator = validator;