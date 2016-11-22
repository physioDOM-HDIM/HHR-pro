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
"use strict";

var humanName     = require("./commonSchema").humanName,
	contact       = require("./commonSchema").contact,
	simpleAddress = require("./commonSchema").simpleAddress,
	account       = require("./commonSchema").account,
	job = require("./commonSchema").job;

/*
@todo
 - get job from list
 */

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
		"job": { type:"string"},
		"organization": { type:"boolean",  "enum": [ false ], required:true},
		"role": { type:"string", required:true },
		"communication": { type:"string", "enum": [ "fr", "es", "nl", "en" ] },
		"active": { type:"boolean", required:true },
		"pilot": { type:"object"},
		"account": { "type":"object", "description":"_id of the account object attached" },
		"perimeter": { type:"string" }
	},
	"additionalProperties":false
};

var organizationSchema = {
	id: "/Organization",
	"type":"object",
	"properties": {
		"_id": { type:"object" },
		"name":    { 
			type:"object",
			properties: {
				"family": { type:"string"}
			},
			required:true
		},
		"organization": { type:"boolean",  "enum": [ true ], required:true},
		"organizationType": { type:"string" },
		"role": { type:"string", required:true },
		"job": { type:"string"},
		"communication": { type:"string", "enum": [ "fr", "es", "nl", "en" ] },
		"telecom": { type:"array",item: { "$ref":"/Contact" } },
		"address": { "$ref":"/SimpleAddress" },
		"active":  { type:"boolean", required:true },
		"account": { "type":"object", "description":"_id of the account object attached" },
		"perimeter": { type:"string" }
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

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(humanName,"/HumanName");
validator.addSchema(simpleAddress,"/SimpleAddress");
validator.addSchema(contact,"/Contact");
validator.addSchema(practitionerSchema,"/Practitioner");
validator.addSchema(organizationSchema,"/Organization");
validator.addSchema(professionalSchema,"/Professional");
validator.addSchema(account,"/Account");

module.exports.validator = validator;