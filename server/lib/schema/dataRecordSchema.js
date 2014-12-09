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
		"source": { type:"string", description:"practitioner ID"},
		"subject": { type:"string", description:"beneficiary ID" }
	}
};



var dataRecordItemSchema = {
	id:"/DataItem",
	type:"object",
	properties: {
		category: { type:"string", enum:[ "General", "HDIM", "Symptoms", "Questionnaire"] },
		text: { type:"string", description:"reference label of the parameter"},
		value: { type:"number"},
		ref: { type: "object", description:"the questionnaire answers identifier"},
		automatic: { type:"boolean", default:false },
		dataRecordID: { type:"object", description:"the identifier of the data record" }
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(dataRecordSchema,"/dataRecord");
validator.addSchema(dataRecordItemSchema,"/dataRecordItem");
module.exports.validator = validator;