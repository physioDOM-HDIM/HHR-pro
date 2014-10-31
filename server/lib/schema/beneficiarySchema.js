/* jslint node:true */
"use strict";

/*
var humanName     = require("./commonSchema").humanName;
var contact       = require("./commonSchema").contact;
var simpleAddress = require("./commonSchema").simpleAddress;
*/


var Validator = require('jsonschema').Validator;
var validator = new Validator();
module.exports.validator = validator;