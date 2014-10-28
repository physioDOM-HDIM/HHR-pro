/* jslint node:true */
"use strict";

var humanName     = require("./commonSchema").humanName;
var contact       = require("./commonSchema").contact;
var simpleAddress = require("./commonSchema").simpleAddress;

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

// @todo:  get role list from database
var role = [
	"administrator",   // for system administrator
	"coordinator",     // for coordinators
	"physician",       // role that could add services and manage health content
	"medical",         // other medical role that have access to health content in read only 
	"social"           // social worker ( no access to health care section )
];

var practitionerSchema = {
	"id": "/Practitioner",
	"description" : "practitioner JSON Schema",
	"type": "object",
	"properties": {
		"_id": { type:"object" },
		"name": { "$ref": "/HumanName", "required": true },
		"telecom": { "type":"array",item: { "$ref":"/Contact" } },
		"address": {"$ref": "/SimpleAddress"},
		"gender": { type:"string", "enum": [ "F" , "M" ] , "required":true},
		"job": { type:"string", "enum": job },
		"role": { type:"string", required:true },
		"communication": { type:"string", "enum": [ "fr", "es", "nl", "en" ] },
		"active": { type:"boolean" },
		"pilot": { type:"object"},
		"account": { "type":"object", "description":"_id of the account object attached" }
	},
	"additionalProperties":false
};

var organizationSchema = {
	id: "/Organization",
	"type":"object",
	"properties": {
		"_id": { type:"object" },
		"name":    { type:"string", required:true },
		"organization": { type:"boolean",  "enum": [ true ], required:true},
		"role": { type:"string", required:true },
		"communication": { type:"string", "enum": [ "fr", "es", "nl", "en" ] },
		"telecom": { type:"array",item: { "$ref":"/Contact" } },
		"address": { "$ref":"/SimpleAddress" },
		"active":  { type:"boolean" },
		"account": { "type":"object", "description":"_id of the account object attached" }
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



var account = {
	id: "/Account",
	"type":"object",
	"properties": {
		"login":    { type:"string", required:true },
		"password": { type:"string", required: true },
		"active":   { type:"boolean" },
		"role":     { type:"string", "enum": role },
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

module.exports.validator = validator;