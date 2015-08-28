"use strict";

/**
 * Service Items Schema
 *
 * A service is created by a professional at his office.
 *
 */

var serviceSchema = {
	id        : "/serviceItem",
	type      : "object",
	properties: {
		"category" : {type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : {type: "string" , required: true },
		"frequency": {type: "string", enum: ["weekly", "daily", "monthly"], default: "weekly", required: true},
		"repeat"   : {type: "integer", default: 1},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"when"     : [
			{
				type      : "object",
				properties: {
					"days": {type: "array", description: "day in the week", required: true}
				}
			}
		],
		"meal": { type:"array", item:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: "object", description: "professional ID of the provider"}
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(serviceSchema,"/serviceItem");
module.exports.validator = validator;