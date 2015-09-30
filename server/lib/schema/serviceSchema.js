"use strict";

/**
 * Service Items Schema
 *
 * A service is created by a professional at his office.
 *
 */

var dailyServiceSchema = {
	id        : "/dailyService",
	type      : "object",
	properties: {
		"category" : {type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : {type: "string" , required: true },
		"label"    : { type:"string" },
		"active"   : { type: "boolean", required:true },
		"deactivate" : {
			type: "object",
			properties : {
				"source": {type: "object", description: "professional ID", required: true},
				"date": {type: "string", format: "date", required: true}
			}
		},
		"frequency": {type: "string", enum: ["weekly"], required: true},
		"repeat"   : {type: "integer", default: 1},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"duration" : {type: "integer", default: 60 },
		"meal": { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: "object", description: "professional ID of the provider"}
	},
	"additionalProperties":false
};

var weeklyServiceSchema = {
	id        : "/weeklyService",
	type      : "object",
	properties: {
		"category" : {type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : {type: "string" , required: true },
		"label"    : { type:"string" },
		"active"   : { type: "boolean", required:true },
		"deactivate" : {
			type: "object",
			properties : {
				"source": {type: "object", description: "professional ID", required: true},
				"date": {type: "string", format: "date", required: true}
			}
		},
		"frequency": {type: "string", enum: ["weekly"], required: true},
		"repeat"   : {type: "integer", default: 1},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"duration" : {type: "integer", default: 60 },
		"meal": { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: "object", description: "professional ID of the provider"},
		"when": { 
			type:"object",
			properties: {
				"day": { type:"string", enum: ["monday","tuesday","wednesday","thursday","friday","saturday","sonday"] },
				"time": { type:"string", pattern:"^[0-2][0-9]:[0-5][0-9]$"}
			},
			required:true
		}
	},
	"additionalProperties":false
};

var monthlyServiceSchema = {
	id        : "/monthlyService",
	type      : "object",
	properties: {
		"category" : {type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : {type: "string" , required: true },
		"label"    : { type:"string" },
		"active"   : { type: "boolean", required:true },
		"deactivate" : {
			type: "object",
			properties : {
				"source": {type: "object", description: "professional ID", required: true},
				"date": {type: "string", format: "date", required: true}
			}
		},
		"frequency": {type: "string", enum: ["monthly"], required: true},
		"repeat"   : {type: "integer", default: 1},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"duration" : {type: "integer", default: 60 },
		"meal": { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: "object", description: "professional ID of the provider"},
		"when": { type:"array", items: { type:"integer"}, required: true }
	},
	"additionalProperties":false
};

var serviceSchema = {
	id:"/serviceItem",
	"oneOf": [
		{ "$ref":"/monthlyService"},
		{ "$ref":"/weeklyService"},
		{ "$ref":"/dailyService"}
	]
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(dailyServiceSchema,"/dailyService");
validator.addSchema(weeklyServiceSchema,"/weeklyService");
validator.addSchema(monthlyServiceSchema,"/monthlyService");
validator.addSchema(serviceSchema,"/serviceItem");
module.exports.validator = validator;