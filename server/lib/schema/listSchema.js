/* jslint node:true */
"use strict";

var unity     		= require("./commonSchema").unity,
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
		"roleTypeCode": { type:"array", item: { "enum": roleTypeCode }}
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
		"unity": { type:"string", "enum": unity },
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