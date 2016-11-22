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
 * Service Items Schema
 *
 * A service is created by a professional at his office.
 *
 */
var punctualServiceSchema = {
	id        : "/punctualService",
	type      : "object",
	properties: {
		"_id"      : {type: "object", description: "ID of the service if exists"},
		"category" : {type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : {type: "string" , required: true },
		"create"   : { type: "boolean"},
		"label"    : { type:"string" },
		"detail"   : { type:"string" },
		"active"   : { type: "boolean", required:true },
		"deactivated" : {
			type: "object",
			properties : {
				"source": {type: "object", description: "professional ID", required: true},
				"date": {type: "string", format: "date", required: true}
			}
		},
		"frequency": {type: "string", enum: ["punctual"], required: true},
		"repeat"   : {type: "integer", default: 0},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"duration" : {type: "integer", default: 60 },
		"time": { type:"string", pattern:"^[0-2][0-9]:[0-5][0-9]$"},
		"meal": { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: ["object","null"], description: "professional ID of the provider"},
		"when": { type: "null" }
	},
	"additionalProperties":false
};

var dailyServiceSchema = {
	id        : "/dailyService",
	type      : "object",
	properties: {
		"_id"      : { type: "object", description: "ID of the service if exists"},
		"category" : { type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : { type: "string" , required: true },
		"create"   : { type: "boolean"},
		"label"    : { type:"string" },
		"detail"   : { type:"string" },
		"active"   : { type: "boolean", required:true },
		"deactivated" : {
			type: "object",
			properties : {
				"source": {type: "object", description: "professional ID", required: true},
				"date": {type: "string", format: "date", required: true}
			}
		},
		"frequency": {type: "string", enum: ["daily"], required: true},
		"repeat"   : {type: "integer", default: 1},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"duration" : {type: "integer", default: 60 },
		"time": { type:"string", pattern:"^[0-2][0-9]:[0-5][0-9]$"},
		"meal": { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: ["object","null"], description: "professional ID of the provider"},
		"when": { type: "null" }
	},
	"additionalProperties":false
};

var weeklyServiceSchema = {
	id        : "/weeklyService",
	type      : "object",
	properties: {
		"_id"      : {type: "object", description: "ID of the service if exists"},
		"category" : {type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"      : {type: "string" , required: true },
		"create"   : { type: "boolean"},
		"label"    : { type:"string" },
		"detail"   : { type:"string" },
		"active"   : { type: "boolean", required:true },
		"deactivated" : {
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
		"time": { type:"string", pattern:"^[0-2][0-9]:[0-5][0-9]$"},
		"duration" : {type: "integer", default: 60 },
		"meal": { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source" : {type: "object", description: "professional ID of the prescriber"},
		"provider"  : {type: ["object","null"], description: "professional ID of the provider"},
		"when": { type:"array", items: { type:"integer"}, required: true }
	},
	"additionalProperties":false
};

var monthlyServiceSchema = {
	id        : "/monthlyService",
	type      : "object",
	properties: {
		"_id"        : { type: "object", description: "ID of the service if exists"},
		"category"   : { type: "string", enum: ["HEALTH", "SOCIAL", "ASSIST"] , required: true },
		"ref"        : { type: "string" , required: true },
		"create"     : { type: "boolean"},
		"label"      : { type:"string" },
		"detail"     : { type:"string" },
		"active"     : { type: "boolean", required:true },
		"deactivated" : {
			type: "object",
			properties : {
				"source": {type: "object", description: "professional ID", required: true},
				"date":   {type: "string", format: "date", required: true}
			}
		},
		"frequency": {type: "string", enum: ["monthly"], required: true},
		"repeat"   : {type: "integer", default: 1},
		"startDate": {type: "string", format: "date", required: true},
		"endDate"  : {type: "string", format: "date"},
		"time"     : { type:"string", pattern:"^[0-2][0-9]:[0-5][0-9]$"},
		"duration" : {type: "integer", default: 60 },
		"meal"     : { type:"array", items:{ type: "string" } },
		"subject"  : {type: "object", description: "beneficiary ID"},
		"source"   : {type: "object", description: "professional ID of the prescriber"},
		"provider" : {type: ["object","null"], description: "professional ID of the provider"},
		"when"     : { type:"array", items: { type:"integer"}, required: true }
	},
	"additionalProperties":false
};

var serviceSchema = {
	id:"/serviceItem",
	"oneOf": [
		{ "$ref":"/monthlyService"},
		{ "$ref":"/weeklyService"},
		{ "$ref":"/dailyService"},
		{ "$ref":"/punctualService"}
	]
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(punctualServiceSchema,"/punctualService");
validator.addSchema(dailyServiceSchema,"/dailyService");
validator.addSchema(weeklyServiceSchema,"/weeklyService");
validator.addSchema(monthlyServiceSchema,"/monthlyService");
validator.addSchema(serviceSchema,"/serviceItem");
module.exports.validator = validator;