/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

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
				"sf36Score": {
					type: "number",
					default: 0,
					description: "SF36 questionnaire score"
				},
				"sf36Date": {
					type: "date",
					description: "SF36 questionnaire date"
				},
				"sf36Answer": {
					type: "string",
					description: "SF36 questionnaire answer ID"
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
				"commentWeight": {
					type: "string",
					description: "Weight comment"
				},
				"lean": {
					type: "number",
					description: "Lean/fat ratio"
				},
				"commentLean": {
					type: "string",
					description: "Lean/fat ratio comment"
				},
				"bmi": {
					type: "number",
					description: "BMI"
				},
				"commentBmi": {
					type: "string",
					description: "BMI comment"
				},
				"mnaScore": {
					type: "number",
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
				"commentMna": {
					type: "string",
					description: "MNA comment"
				},
				"mnaSfScore": {
					type: "number",
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
				"commentMnaSf": {
					type: "string",
					description: "MNA SF comment"
				},
				"snaqScore": {
					type: "number",
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
				"commentSnaq": {
					type: "string",
					description: "SNAQ comment"
				},
				"dhdScore": {
					type: "number",
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
				"commentDhd": {
					type: "string",
					description: "DHD-FFQ comment"
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
		"validatedDate": {
			type: "string",
			format: "date",
			description: "validation date"
		},
		"validatedAuthor": {
			type: "object",
			description: "author Object ID"
		},
		"validated": {
			type: "boolean",
			description: "this group of data has been validated",
			required: false
		}
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