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
module.exports.job = job;

// @todo:  get role list from database
var role = [
	"administrator",   // for system administrator
	"coordinator",     // for coordinators
	"physician",       // role that could add services and manage health content
	"medical",         // other medical role that have access to health content in read only 
	"social"           // social worker ( no access to health care section )
];
module.exports.role = role;

module.exports.humanName = {
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

module.exports.simpleAddress = {
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

module.exports.contact = {
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

module.exports.account = {
	id: "/Account",
	"type":"object",
	"properties": {
		"_id":      { type:"string" },
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