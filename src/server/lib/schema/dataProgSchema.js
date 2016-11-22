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