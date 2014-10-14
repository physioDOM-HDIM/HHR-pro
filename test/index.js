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

var fs      = require('fs'),
	Mocha   = require('mocha'),
	join    = require('path').join,
	moment  = require('moment'),
	prog    = require('commander'),
	pkg     = require('../package');

// Setup mocha
var mocha = new Mocha({
	ui : 'tdd',
	globals : ['okGlobalA', 'okGlobalB', 'okGlobalC', 'callback*'],
	reporter : "spec",
	ignoreLeaks: true
});

mocha.addFile(join(__dirname,'testDirectory.js'));

mocha.run(function onEnding() {
	console.log("testing done");
});