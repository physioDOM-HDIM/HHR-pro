/* jslint node:true */
"use strict";

// @todo:  get job list from database
var job = [
	"system administrator",
	"coordinator",
	"physician",
	"pharmacist",
	"Physician assistant",
	"dietitian",
	"therapist",
	"paramedic",
	"nurse",
	"professional home carer",
	"social worker"
];

var practitionerSchema = {
	"id": "/Practitioner",
	"description" : "practitioner JSON Schema",
	"type": "object",
	"properties": {
		"name": { "$ref": "/HumanName", "required": true },
		"telecom": { "type":"array",item: { "$ref":"/Contact" } },
		"address": {"$ref": "/SimpleAddress"},
		"gender": { type:"string", "enum": [ "F" , "M" ] , "required":true},
		"job": { type:"string", "enum": job },
		"communication": { type:"string", "enum": [ "fr", "es", "nl", "en" ] },
		"active": { type:"boolean" },
		"pilot": { type:"object"},
		"account": { "$ref":"/Account" }
	},
	"additionalProperties":false
};

var organizationSchema = {
	id: "/Organization",
	"type":"object",
	"properties": {
		"name":    { type:"string", required:true },
		"organization": { type:"boolean",  "enum": [ true ], required:true},
		"telecom": { type:"array",item: { "$ref":"/Contact" } },
		"address": { "$ref":"/SimpleAddress" },
		"active":  { type:"boolean" },
		"account": { "$ref":"/Account" }
	},
	"additionalProperties":false
};

var professionalSchema = {
	id:"/Professional",
	"oneOf": [
		{ "$ref":"/Practitioner"},
		{ "$ref":"/Organization"}
	]
};

var humanName = {
	"id":"/HumanName",
	"description" : "Human Name define name of a person",
	"type":"object",
	"properties": {
		"family": { type:"string", required:true },
		"given":  { type:"string", required:true },
		"prefix": { type:"string" },
		"suffix": { type:"string" }
	},
	"additionalProperties":false
};

var simpleAddress = {
	"id":"/SimpleAddress",
	"description" : "Address defines a postal address",
	"type":"object",
	"properties": {
		"use"    : {type: "string", "enum": ["home", "work", "temp", "old"]},
		"text"   : {type: "string"},
		"line"   : {type:"array",item: {type: "string"}},
		"city"   : {type: "string"},
		"state"  : {type: "string"},
		"zip"    : {type: "string"},
		"country": {type: "string"}
	},
	"additionalProperties":false
};

var contact = {
	"id":"/Contact",
	"description" : "Contact defines a contact way to join a person by example phone",
	"type":"object",
	"additionalProperties":false,
	"oneOf": [
		{
			type:"object",
			"additionalProperties":false,
			properties: {
				"system": {type: "string", "enum": ["phone", "mobile"]},
				"value" : {type: "string", format:"phone"},
				"use": { type:"string", "enum":[ "home","work","temp","old"] }
			}
		},
		{
			type:"object",
			"additionalProperties":false,
			properties: {
				"system": ["email"],
				"value" : { type   : "string", format: "email" },
				"use": { type:"string", "enum":[ "home","work","temp","old"] }
			}
		}
	]
};

var account = {
	id: "/Account",
	"type":"object",
	"properties": {
		"login":    { type:"string", required:true },
		"password": { type:"string", required: true },
		"email":    { "type":"string", "format":"email" },
		"active":   { type:"boolean" },
		"role":     { type:"string", "enum": job },
		"person": {
			"ID": { type:"object", "description":"object id" },
			"type" : { type:"string", description:"collection name" }
		}
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(practitionerSchema,"/Practitioner");
validator.addSchema(organizationSchema,"/Organization");
validator.addSchema(professionalSchema,"/Professional");
validator.addSchema(humanName,"/HumanName");
validator.addSchema(simpleAddress,"/SimpleAddress");
validator.addSchema(contact,"/Contact");
validator.addSchema(account,"/Account");

module.exports.professional = professionalSchema;
module.exports.validator = validator;