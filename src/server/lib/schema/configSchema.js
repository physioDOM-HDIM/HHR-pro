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

var configSchema = {
  id        : "/Config",
  type      : "object",
  properties: {
    "port"       : {type: "integer", minimum: 8000, maximum: 8080, required: true},
    "cache"      : {type: "boolean", default: true},
    "server"     : {
      type      : "object",
      required  : true,
      properties: {
        protocol: {type: "string", required: true, description: "protocol http:// or https://"},
        name    : {type: "string", required: true, description: "dns name of the service"}
      }
    },
    "mongo"      : {
      type                  : "object",
      properties            : {
        ip  : {type: "string", description: "ip of the mongo server", required: true},
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
    "Lang"       : {
      type       : "string",
      enum       : ["en", "en_gb", "nl", "es", "fr"],
      description: "default language of the instance",
      required   : true
    },
    "languages"  : {type: "array", description: "array of all supported languages"},
    "agenda"     : {type: "string", description: "cron to send measures and symptoms plans"},
    "agendaForce": {type: "string", description: "cron to send measures and symptoms plans forced"},
    "key"        : {
      type       : "string",
      pattern    : "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$",
      description: "key of the instance for the queue service"
    },
    "queue"      : {
      type                  : "object",
      properties            : {
        protocol: {type: "string", pattern: "^(http|https)", required: true},
        ip      : {type: "string", required: true},
        port    : {type: "integer", default: 9000, minimum: 9000, maximum: 9100},
        duration: {type: "integer", default: 3, minimum: 2}
      },
      "additionalProperties": false
    },
    "IDS"        : {
      type      : "object",
      properties: {
        ip     : {type: "string", required: true},
        appName: {type: "string", required: true}
      }
    },
    "country"    : {type: "string"},
    "mailTpl"    : {type: "string"}
  }
};

var Validator = require('jsonschema').Validator;
var validator = new Validator();
validator.addSchema(configSchema, "/Config");

module.exports.validator = validator;