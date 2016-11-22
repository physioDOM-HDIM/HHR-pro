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

var units     		= require("./commonSchema").units,
	roleTypeCode	= require("./commonSchema").roleTypeCode;

var listSchema = {
	id:"/List",
	type:"object",
	properties: {
		"_id": { type:"object" },
		"name": { type:"string", required:true, description:"name of the list" },
		"editable": { type: "boolean", required: true},
		"measure": { type: "boolean"},
		"service": { type: "boolean"},
		"hasRank": { type: "boolean"},
		"hasTVLabel": { type: "boolean"},
		"items": {
			type:"array",
			"anyOf": [
				{ item : { "$ref":"/ListItem_Basic" } },
				{ item : { "$ref":"/ListItem_Measurable" } }
			]
		}
	}
};

var listItem_BasicSchema = {
	id:"/ListItem_Basic",
	type:"object",
	properties: {
		"ref"  : { type : "string", required:true, description: "reference name of the item" },
		"label": {
			type:"object",
			"anyOf":[
				{ properties : { "en": {type: "string"} } },
				{ properties : { "es": {type: "string"} } },
				{ properties : { "nl": {type: "string"} } }
			]
		},
		"active": { type: "boolean"},
		"rank": { type: "number"},
		"TVLabel": { type: "string"},
		"roleTypeCode": { type:"array", item: { "enum": roleTypeCode }},
		"diet": { type: "boolean"}
	}
};

var listItem_MeasurableSchema = {
	id:"/ListItem_Measurable",
	type:"object",
	properties: {
		"ref"  : { type : "string", required:true, description: "reference name of the item" },
		"label": {
			type:"object",
			"anyOf":[
				{ properties : { "en": {type: "string"} } },
				{ properties : { "es": {type: "string"} } },
				{ properties : { "nl": {type: "string"} } }
			]
		},
		"active": { type: "boolean"},
		"units": { type:"string", "enum": units },
		"threshold": {
			"min": {type: "number"},
			"max": {type: "number"}
		},
		"range": {
			"min": {type: "number"},
			"max": {type: "number"}
		},
		"autoInput": { type: "boolean", required: true}
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(listSchema,"/List");
validator.addSchema(listItem_BasicSchema,"/ListItem_Basic");
validator.addSchema(listItem_MeasurableSchema,"/ListItem_Measurable");
module.exports.validator = validator;