#!/usr/bin/env node
/**
 * @Module Test
 * @date 2013-09-01
 * @author Fabrice LE COZ <fabrice.lecoz@telecomsante.com>
 * @copyright © Télécom Santé
 * @description
 *
 * Test suite for Customer API
 */
'use strict';

var Mocha   = require('mocha'),
	join    = require('path').join,
	request = require("request");

// Setup mocha
var mocha = new Mocha({
	ui : 'bdd',
	globals : ['okGlobalA', 'okGlobalB', 'okGlobalC', 'callback*'],
	reporter : "spec",
	ignoreLeaks: true
});

GLOBAL.domain = 'http://127.0.0.1:8001';
GLOBAL.sessionCookies = [];
GLOBAL.sessionCookie = request.jar();

mocha.addFile(join(__dirname,'testAgenda.js'));
/*
mocha.addFile(join(__dirname,'backend/testDirectory.js'));
mocha.addFile(join(__dirname,'backend/testBeneficiaries.js'));
mocha.addFile(join(__dirname,'backend/testLists.js'));
*/

mocha.run(function onEnding() {
	console.log("testing done");
});