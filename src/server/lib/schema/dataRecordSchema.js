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
 * Data Record Schema
 * 
 * A data record come from the beneficiary home (1), or created by a professional at his office(2).
 * 
 * in the case (1) : home is set to true and source is null
 * in case (2) : home is set to false and source is the database identifier of the professional.
 */
var dataRecordSchema = {
	id:"/DataRecord",
	type:"object",
	properties: {
		"dataRecordID": { type:"string", description:"ObjectID from the database" },
		"datetime": { type:"string", format:"date-time"},
		"home": { type:"boolean", default:"false" },
		"healthStatus": { type: "boolean", default: "false" },
		"source": { type:"string", description:"practitioner ID"},
		"subject": { type:"string", description:"beneficiary ID" },
		"items": { "$ref": "/DataItems" }
	}
};

var dataItemsSchema = {
	id:"/DataItems",
	type:"array",
	items: {"$ref": "/DataItem"}
};

var dataRecordItemSchema = {
	id:"/DataItem",
	type:"object",
	properties: {
		"_id": { type:"string", description: "the identifier of the item in database"},
		category: { type:"string", enum:[ "measures", "General", "HDIM", "symptom", "questionnaire"], required: true },
		text: { type:"string", description:"reference label of the parameter", required: true},
		value: { type:"number", description:"value of the item ( score for a questionnaire )", required: true },
		ref: { type: "string", description:"the questionnaire answers identifier"},
		comment: { type: "string", description: "comment for questionnaire"},
		automatic: { type:"boolean", default:false },
		measureDate: { type:"integer", description:"date when the value is filled"},
		dataRecordID: { type:"string", description:"the identifier of the data record" }
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(dataRecordSchema,"/dataRecord");
validator.addSchema(dataItemsSchema,"/dataItems");
validator.addSchema(dataRecordItemSchema,"/dataRecordItem");
module.exports.validator = validator;