/* jslint node:true */
'use strict';

var menuSchema = {
	id: "/Menu",
	type: "object",
	title: "Menu item",
	description : "Menu item JSON Schema",
	properties: {
		"_id": {
			type: "object",
		},
		"type": {
			type: "string",
			enum: ["item", "submenu"],
			description: "Type of item",
			required: true
		},
		"label": {
			type: "string",
			description: "SF12 questionnaire date",
			required: true
		},
		"link": {
			type: "string",
			description: "Link url"
		},
		"rights": {
			type: "object",
			description: "Rights"
		},
		"disabled": {
			type: "boolean",
			default: false
		},
		"index": {
			type: "integer",
			default: 0,
			description: "Index"
		},
		"parent": {
			type: "string",
			default: "",
			description: "Parent ID"
		}
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(menuSchema, '/Menu');

module.exports.validator = validator;