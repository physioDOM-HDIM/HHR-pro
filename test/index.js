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
	join    = require('path').join;

// Setup mocha
var mocha = new Mocha({
	ui : 'bdd',
	globals : ['okGlobalA', 'okGlobalB', 'okGlobalC', 'callback*'],
	reporter : "spec",
	ignoreLeaks: true
});

mocha.addFile(join(__dirname,'testDirectory.js'));
// mocha.addFile(join(__dirname,'testBeneficiaries.js'));

mocha.run(function onEnding() {
	console.log("testing done");
});