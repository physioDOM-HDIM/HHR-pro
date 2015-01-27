"use strict";

var configSchema = {
	id  : "/Config",
	type : "object",
	properties  : {
		"port" : {type: "integer", minimum: 8000, maximum: 8080, required: true},
		"cache": {type: "boolean", default: true},
		"mongo": {
			type                  : "object",
			properties            : {
				ip  : {format: "ipv4", description: "ip of the mongo server", required: true},
				db  : {type: "string", description: "name of the database", required: true},
				port: {
					type       : "integer",
					minimum    : 25000,
					maximum    : 30000,
					default    : 27017,
					description: "port of the mongodb server if not default"
				}
			},
			"additionalProperties": false
		},
		"Lang" : {
			type       : "string",
			enum       : ["en", "nl", "es", "fr"],
			description: "default language of the instance",
			required   : true
		},
		"key"  : {
			type       : "string",
			pattern    : "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$",
			description: "key of the instance for the queue service"
		},
		"queue": {
			type : "object",
			properties : {
				protocol: {type: "string", pattern: "^(http|https)", required: true},
				ip      : {format: "ipv4", required: true},
				port    : {type: "integer", default: 9000, minimum: 9000, maximum: 9100}
			},
			"additionalProperties": false
		}
	}
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(configSchema,"/Config");

module.exports.validator = validator;