/* jslint node:true */
"use strict";

var listSchema = {
	id:"/List",
	type:"object",
	properties: {
		"_id": { type:"object" },
		"name": { type:"string", required:true, description:"name of the list" },
		"editable": { type: "boolean", required: true},
		items: {
			type:"array", "$ref":"/ListItem"
		}
	}
};

var listItemSchema = {
	id:"/ListItem",
	type:"object",
	properties: {
		"ref"  : {
			type       : "string", required:true, description: "reference name of the item"
		},
		"label": {
			"en": {type: "string"},
			"es": {type: "string"},
			"nl": {type: "string"}
		}
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(listSchema,"/List");
validator.addSchema(listItemSchema,"/ListItem");

module.exports.validator = validator;