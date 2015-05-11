"use strict";

var humanName = require("./commonSchema").humanName;
var contact = require("./commonSchema").contact;
var simpleAddress = require("./commonSchema").simpleAddress;
var maritalStatus = require("./commonSchema").maritalStatus;

var beneficiarySchema = {
	id                    : "/Beneficiary",
	type                  : "object",
	properties            : {
		"_id"          : {type: "object", description: "beneficiary ID in the database"},
		"name"         : {"$ref": "/HumanName", required: true},
		"telecom"      : {"type": "array", item: {"$ref": "/Contact"}},
		"birthdate"    : {type: "string", format: "date", required: true},
		"size"         : {type: "number"},
		"deceased"     : {type: "boolean"},
		"address"      : {type: "array", item: {"$ref": "/SimpleAddress"}},
		"gender"       : {type: "string", "enum": ["F", "M"], "required": true},
		"maritalStatus": {type: "string"},
		"active"       : {type: "boolean"},
		"contact"      : {type: "array", "$ref": "/ContactPartner"},
		"account"      : {type: "object", "description": "ObjectID of the account"},
		"socialID"     : {type: "string"},
		"perimeter"    : {type: "string"},
		"lifeCond"     : {
			type                  : "object",
			properties            : {
				"disability": {
					type      : "object",
					properties: {
						"type"   : {type: "string"},
						"percent": {type: "integer"}
					}
				},
				"wayOfLife" : {type: "string"},
				"profession" : {type: "string"}
			},
			"additionalProperties": false
		},
		"entry"        : {
			type                  : "object",
			properties            : {
				"demand"     : {type: "string"},
				"startDate"  : {format: "date"},
				"plannedEnd" : {format: "date"},
				"endDate"    : {format: "date"},
				"comeFrom"   : {type: "string"},
				"destination": {type: "string"},
				"exitReason" : {type:"string"}
			},
			"additionalProperties": false
		},
		"biomaster"    : {type: "string", description: "reference to the biomaster"},
		"professionals": {
			type : "array",
			items: {
				type                  : "object",
				"properties"          : {
					"professionalID": {type: "string", required: true},
					"referent"      : {type: "boolean", required: true}
				},
				"additionalProperties": false
			}
		},
		"validate"     : {type: "boolean", required: true},
		"diagnosis"    : {
			type                  : "object",
			properties            : {
				"general"    : {type: "string"},
				"nutritional": {type: "string"},
				"chronic"    : {
					type      : "object",
					properties: {
						main: {type: "string"}
					}
				}
			},
			"additionalProperties": false
		},
		"threshold"    : {
			type: "object"
		}
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
validator.addSchema(humanName, "/HumanName");
validator.addSchema(simpleAddress, "/SimpleAddress");
validator.addSchema(contact, "/Contact");
validator.addSchema(contactPartnerSchema, "/ContactPartner");
validator.addSchema(beneficiarySchema, "/Beneficiary");
module.exports.validator = validator;