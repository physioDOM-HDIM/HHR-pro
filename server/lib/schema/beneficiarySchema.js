"use strict";

var humanName     = require("./commonSchema").humanName;
var contact       = require("./commonSchema").contact;
var simpleAddress = require("./commonSchema").simpleAddress;
var maritalStatus = require("./commonSchema").maritalStatus;

var beneficiarySchema = {
	id:"/Beneficiary",
	type:"object",
	properties: {
		"_id"          : { type:"object", description:"beneficiary ID in the database" },
		"name"         : {"$ref": "/HumanName", required:true},
		"telecom": { "type":"array",item: { "$ref":"/Contact" } },
		"birthdate"    : { type   : "string", format: "date", required: true },
		"height"       : {type: "number"},
		"deceased"     : {type: "boolean"},
		"address"      : {type: "array", "$ref": "/SimpleAddress"},
		"gender": { type:"string", "enum": [ "F" , "M" ] , "required":true},
		"maritalStatus": {type: "string", "enum": maritalStatus},
		"active"       : {type: "boolean" },
		"contact"      : {type: "array", "$ref": "/ContactPartner"},
		"account"      : {"type": "object"},
		"socialID"     : {type: "string"},
		"lifeCond"     : {
			type:"object",
			properties: {
				"disability": {
					type:"object",
					properties: {
						"type"   : {type: "string"},
						"percent": {type: "integer"}
					}
				},
				"wayOfLife" : {type: "string"},
				"profession": {type: "string"}
			},
			"additionalProperties": false
		},
		"entry"        : {
			type:"object",
			properties: {
				"demand"    : {type: "string", required:true},
				"startDate" : {format: "date", required:true},
				"plannedEnd": {format: "date", required:true},
				"endDate"   : {format: "date"},
				"comeFrom"  : {type: "string"}
			},
			"additionalProperties": false
		},
		"biomaster"    : {type: "string", description: "reference to the biomaster"},
		"professionals": {
			type : "array",
			items: {
				type                  : "object",
				"properties"          : {
					"professionalID": {type: "object", required: true},
					"referent"      : {type: "boolean", required: true}
				},
				"additionalProperties": false
			}
		},
		"validate"     : {type: "boolean", required: true }
	},
	"additionalProperties": false
};

var contactPartnerSchema = {
	"id"        : "/ContactPartner",
	"type"      : "object",
	"properties": {
		"name"   : {"$ref": "/HumanName", required: true},
		"telecom": {type: "array", "$ref": "/Contact"},
		"address": {type: "array", "$ref": "/SimpleAddress"},
		"gender" : {type: "string", "enum": ["F", "M"]}
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(humanName,"/HumanName");
validator.addSchema(simpleAddress,"/SimpleAddress");
validator.addSchema(contact,"/Contact");
validator.addSchema(contactPartnerSchema,"/ContactPartner");
validator.addSchema(beneficiarySchema,"/Beneficiary");
module.exports.validator = validator;