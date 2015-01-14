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