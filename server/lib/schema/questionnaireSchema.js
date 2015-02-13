/* jslint node:true */
"use strict";

var questionnaireSchema = {
	id: "/Questionnaire",
	description: "questionnaire JSON Schema",
	type: "object",
	properties: {
		"_id": {type: "object"},
		"name": {type: "string", required: true, "description": "name of the questionnaire"},
		"ref": {type: "string", description: "reference name of the item displayed on the TV"},
		"label": {
			type: "object",
			description: "name of the questionnaire displaying on the TV",
			"anyOf": [
				{properties: {"en": {type: "string"}}},
				{properties: {"es": {type: "string"}}},
				{properties: {"nl": {type: "string"}}}
			]
		},
		"questions": {
			type: "array",
			items: {
				anyOf: [
					{$ref: "/Questionnaire.group"},
					{$ref: "/Questionnaire.question"}
				]
			}
		}
	},
	additionalProperties: false
};

var questionnaireGroupSchema = {
	id: "/Questionnaire.group",
	type: "object",
	additionalProperties: false,
	properties: {
		"headerRef": {type: "string", description: "header text of the group"},
		"headerLabel": {
			type: "object",
			description: "header text of the group",
			"anyOf": [
				{properties: {"en": {type: "string"}}},
				{properties: {"es": {type: "string"}}},
				{properties: {"nl": {type: "string"}}}
			]
		},
		"questions": {
			type: "array",
			items: {
				anyOf: [
					{$ref: "/Questionnaire.group"},
					{$ref: "/Questionnaire.question"}
				]
			},
			required: true
		},
		"subscore": {type: "string", description: "calculation of the subscore, if omitted subscore is the sum"}
	}
};

var questionnaireQuestionSchema = {
	id: "/Questionnaire.question",
	type: "object",
	oneOf: [
		{
			properties: {
				"ref": {type: "string", required: true},
				"label": {
					type: "object",
					"anyOf": [
						{properties: {"en": {type: "string"}}},
						{properties: {"es": {type: "string"}}},
						{properties: {"nl": {type: "string"}}}
					]
				},
				"choice": {type: "array", item: {$ref: "/Questionnaire.simplequestion"}}
			},
			additionalProperties: false
		},
		{$ref: "/Questionnaire.simplequestion"}
	]
};

var questionnaireSimpleQuestionSchema = {
	id: "/Questionnaire.simplequestion",
	type: "object",
	oneOf: [
		{
			properties: {
				"name": {type: "string", description: "reference name of the question by example"},
				"system": {enum: ["integer"], required: true},
				"ref": {type: "string"},
				"label": {
					type: "object",
					"anyOf": [
						{properties: {"en": {type: "string"}}},
						{properties: {"es": {type: "string"}}},
						{properties: {"nl": {type: "string"}}}
					]
				},
				"value": {type: "integer"}
			},
			additionalProperties: false
		},
		{
			properties: {
				"name": {type: "string", description: "reference name of the question by example"},
				"system": {enum: ["boolean"], required: true},
				"ref": {type: "string"},
				"label": {
					type: "object",
					"anyOf": [
						{properties: {"en": {type: "string"}}},
						{properties: {"es": {type: "string"}}},
						{properties: {"nl": {type: "string"}}}
					]
				},
				"value": {type: "integer"}
			},
			additionalProperties: false
		},
		{
			properties: {
				"name": {type: "string", description: "reference name of the question by example"},
				"system": {enum: ["decimal"], required: true},
				"ref": {type: "string"},
				"label": {
					type: "object",
					"anyOf": [
						{properties: {"en": {type: "string"}}},
						{properties: {"es": {type: "string"}}},
						{properties: {"nl": {type: "string"}}}
					]
				},
				"value": {type: "number"}
			},
			additionalProperties: false
		},
		{
			properties: {
				"name": {type: "string", description: "reference name of the question by example"},
				"system": {enum: ["string"], required: true},
				"ref": {type: "string"},
				"label": {
					type: "object",
					"anyOf": [
						{properties: {"en": {type: "string"}}},
						{properties: {"es": {type: "string"}}},
						{properties: {"nl": {type: "string"}}}
					]
				}
			},
			additionalProperties: false
		}
	]
};

var questionnairePlan = {
	id: "/Questionnaire.plan",
	type: "object",
	properties: {
		"_id": {type: "string"},
		"ref": {type: "string", required: true},
		"subject": {type: "string"},
		"frequency": {type: "string"},
		"comment": {type: "string"},
		"date": {
			type: "array",
			items: {
				type: "string",
				pattern: "^20[0-9]{2}-[0-1][0-9]-[0-3][0-9]$"
			}
		}
	},
	additionalProperties: false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(questionnaireSchema, "/Questionnaire");
validator.addSchema(questionnaireGroupSchema, "/Questionnaire.group");
validator.addSchema(questionnaireQuestionSchema, "/Questionnaire.question");
validator.addSchema(questionnaireSimpleQuestionSchema, "/Questionnaire.simplequestion");
validator.addSchema(questionnairePlan, "/Questionnaire.plan");

module.exports.validator = validator;