/* jslint node:true */
"use strict";

// @todo:  get roleTypeCode list from database
var roleTypeCode = [
	"203BC0100Y",
	"111N00000N",
	"122300000N",
	"203BD0300N",
	"203BG0100Y",
	"203BG0000Y",
	"203BS0100Y",
	"203BG0400N",
	"291U00000N",
	"203BN0400Y",
	"163W00000N",
	"133N00000N",
	"203BX0100Y",
	"203BS0106Y",
	"203BX0600Y",
	"183500000N",
	"203BP0400Y",
	"261QP1100N",
	"203BP0800Y",
	"203BP1003Y",
	"203BR0200Y",
	"203BU0100Y",
	"2514H0200N",
	"MEALDELIV",
	"DEVIDELIV",
	"HOMESERV",
	"COORD"
];
module.exports.roleTypeCode = roleTypeCode;

// @todo:  get units list from database
var units = [
	"cm",
	"m",
	"km",
	"kg",
	"%",
	"°C",
	"Steps/week"
];
module.exports.units = units;

// @todo:  get job list from database
var job = [
	"administrator",
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

var maritalStatus = [
	"Divorced",
	"Separated",
	"Married",
	"Domestic partner",
	"Single",
	"Widowed"
];
module.exports.maritalStatus = maritalStatus;

module.exports.humanName = {
	"id":"/HumanName",
	"description" : "Human Name define name of a person",
	"type":"object",
	"properties": {
		"family": { type:"string", minLength:1, required:true },
		"given":  { type:"string", minLength:1 },
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
		"line"   : {type: "array",items: {type: "string"}},
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