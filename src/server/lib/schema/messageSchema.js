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