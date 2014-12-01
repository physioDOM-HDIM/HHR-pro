/* jslint node:true */
"use strict";

var questionnaireSchema = {
	id: "/Questionnaire",
	description : "questionnaire JSON Schema",
	type: "object",
	properties: {
        "_id": { type:"object" },
		"name": { type:"string", required:true, "description":"name of the questionnaire"},
        "text": {
            type:"object",
            description:"name of the questionnaire displaying on the TV",
            "anyOf":[
                { properties : { "en": {type: "string"} } },
                { properties : { "es": {type: "string"} } },
                { properties : { "nl": {type: "string"} } }
            ]
        },
        "questions": {
            type:"array",
            item: {
                anyOf: [
                    { $ref:"/Questionnaire.group"},
                    { $ref:"/Questionnaire.question"}
                ]
            }
        }
	},
	additionalProperties:false
};

var questionnaireGroupSchema = {
    id:"/Questionnaire.group",
    type: "object",
    additionalProperties:false,
    properties: {
        "header": {
            type:"object",
            description:"header text of the group",
            "anyOf":[
                { properties : { "en": {type: "string"} } },
                { properties : { "es": {type: "string"} } },
                { properties : { "nl": {type: "string"} } }
            ]
        },
        "questions": {
            type:"array",
            item: {
                anyOf: [
                    { $ref:"/Questionnaire.group"},
                    { $ref:"/Questionnaire.question"}
                ]
            },
            required: true
        },
        "subscore": { type:"string", description:"calculation of the subscore, if omitted subscore is the sum" }
    }
}

var questionnaireQuestionSchema = {
    id:"/Questionnaire.question",
    type: "object",
    oneOf: [
        {
            properties: {
                "text": {
                    type:"object",
                    required:true,
                    "anyOf":[
                        { properties : { "en": {type: "string"} } },
                        { properties : { "es": {type: "string"} } },
                        { properties : { "nl": {type: "string"} } }
                    ]
                },
                "choice": { type:"array", item: { $ref:"/Questionnaire.simplequestion" } }
            },
            additionalProperties:false
        },
        { $ref:"/Questionnaire.simplequestion" }
    ]
}

var questionnaireSimpleQuestionSchema = {
	id:"/Questionnaire.simplequestion",
    type:"object",
    oneOf: [
        {
            properties: {
                "name" : { type:"string", description:"reference name of the question by example" },
                "system": { enum: [ "integer" ], required:true },
                "text": {
                    type:"object",
                    "anyOf":[
                        { properties : { "en": {type: "string"} } },
                        { properties : { "es": {type: "string"} } },
                        { properties : { "nl": {type: "string"} } }
                    ]
                },
                "value": { type:"integer" }
            },
            additionalProperties:false
        },
        {
            properties:{
                "name" : { type:"string", description:"reference name of the question by example" },
                "system": { enum: [ "boolean" ], required:true },
                "text": {
                    type:"object",
                    "anyOf":[
                        { properties : { "en": {type: "string"} } },
                        { properties : { "es": {type: "string"} } },
                        { properties : { "nl": {type: "string"} } }
                    ]
                },
                "value": { type:"integer" }
            },
            additionalProperties:false
        },
        {
            properties:{
                "name" : { type:"string", description:"reference name of the question by example" },
                "system": { enum: [ "decimal" ], required:true },
                "text": {
                    type:"object",
                    "anyOf":[
                        { properties : { "en": {type: "string"} } },
                        { properties : { "es": {type: "string"} } },
                        { properties : { "nl": {type: "string"} } }
                    ]
                },
                "value": { type:"number" }
            },
            additionalProperties:false
        },
        {
            properties:{
                "name" : { type:"string", description:"reference name of the question by example" },
                "system": { enum: [ "string" ], required:true },
                "text": {
                    type:"object",
                    "anyOf":[
                        { properties : { "en": {type: "string"} } },
                        { properties : { "es": {type: "string"} } },
                        { properties : { "nl": {type: "string"} } }
                    ]
                }
            },
            additionalProperties:false
        }
    ]
}

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(questionnaireSchema,"/Questionnaire");
validator.addSchema(questionnaireGroupSchema,"/Questionnaire.group");
validator.addSchema(questionnaireQuestionSchema,"/Questionnaire.question");
validator.addSchema(questionnaireSimpleQuestionSchema,"/Questionnaire.simplequestion");

module.exports.validator = validator;