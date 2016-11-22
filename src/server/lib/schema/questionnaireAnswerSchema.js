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

var questionnaireAnswerSchema = {
	id: "/QuestionnaireAnswer",
	description : "Questionnaire answer JSON Schema",
	type: "object",
	properties: {
		"_id": {
			type: "object"
		},
		"subject": {
			type: "object",
			required: true,
			description: "ObjectID of the beneficiary"
		},
		"datetime": {
			type: "date",
			required: true,
			description: "Date"
		},
		"dataRecordID": {
			type: "object",
			description: "DataRecord ID"
		},
		"ref": {
			type: "object",
			required: true,
			description: "Questionnaire ObjectID"
		},
		"questions": {
			type:"array",
			item: {
				anyOf: [
					{ $ref: "/QuestionnaireAnswer.group"},
					{ $ref: "/QuestionnaireAnswer.choices"}
				]
			}
		},
		"score": {
			type: "number",
			required: true,
			description: "Score"
		}
	},
	additionalProperties: false
};

var questionnaireAnswerGroupSchema = {
	type: "object",
	additionalProperties: false,
	properties: {
		"questions": {
			type: "array",
			item: {
				anyOf: [
					{ $ref: "/QuestionnaireAnswer.group"},
					{ $ref: "/QuestionnaireAnswer.choices"}
				]
			},
			required: true
		}
	}
};

var questionnaireAnswerChoicesSchema = {
	type: "object",
	additionalProperties: false,
	properties: {
		"questions": {
			type: "array",
			item: {
				type: "object",
				properties: {
					"choice": {
						type: "number",
						required: true
					},
					additionalProperties:false
				}
			},
			required: true
		}
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(questionnaireAnswerGroupSchema, '/QuestionnaireAnswer.group');
validator.addSchema(questionnaireAnswerChoicesSchema, '/QuestionnaireAnswer.choices');
validator.addSchema(questionnaireAnswerSchema, '/QuestionnaireAnswer');

module.exports.validator = validator;