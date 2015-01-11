"use strict";

/**
 * message Schema
 *
 * this schema is used to validate the message when posted from the HHR-Pro
 */
var messageSchema = {
	id:"/Message",
	type:"object",
	properties: {
		"title": { type:"string", description:"title of the message" },
		"content": { type:"string", description: "the content of the message" },
		"author": { type:"string", description: "id of the author"}
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(messageSchema,"/Message");
module.exports.validator = validator;