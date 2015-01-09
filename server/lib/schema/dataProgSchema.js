"use strict";

/**
 * Data Prog Items Schema
 *
 * A data record come from the beneficiary home (1), or created by a professional at his office(2).
 *
 * in the case (1) : home is set to true and source is null
 * in case (2) : home is set to false and source is the database identifier of the professional.
 */

var dataProgItemSchema = {
	id        : "/DataProgItem",
	type      : "object",
	properties: {
		"category" : {type: "string", enum: ["General", "HDIM", "symptom"] , required: true },
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
		"subject"  : {type: "object", description: "beneficiary ID"}
	},
	"additionalProperties":false
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(dataProgItemSchema,"/dataProgItem");
module.exports.validator = validator;