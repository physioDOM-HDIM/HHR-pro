/* jslint node:true */
"use strict";

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
