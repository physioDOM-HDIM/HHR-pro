"use strict";

/* jshint node:true */

var fs = require("fs");
var path = require("path");

var filename = "nginx.conf";
fs.exists(__dirname+"/install.json", function(exists) {
	var error = false;

	if(!exists) {
		console.error("ERROR : no install.json file");
		process.exit(1);
	}

	var conf = require("./install.json");
	if( !conf.serverName ) {
		console.log("ERROR : you must define a serverName");
		error = true;
	}
	if( !conf.logDir ) {
		console.log("ERROR : you must define the logDir");
		error = true;
	}
	if( !conf.rootDir ) {
		console.log("ERROR : you must define the rootDir");
		error = true;
	} else {
		conf.rootDir = path.normalize(__dirname+"/../"+conf.rootDir);
	}
	if( conf.sslDir) {
		if( !(fs.existsSync( conf.sslDir + "/server.crt" ) && fs.existsSync( conf.sslDir + "/server.key" ) ) ) {
			console.log("ERROR : can't find server keys");
			error = true;
		}
	}
	if( !conf.nginxDestDir ) {
		console.log("ERROR : doesn't know wher to put the result file ( nginxDestDir )");
		error = true;
	}
	if( error ) {
		process.exit(1);
	}

	fs.readFile(__dirname+"/"+filename, { encoding: 'utf-8' },function(err, data) {
		data = data.replace(/<serverName>/gi,conf.serverName);
		data = data.replace(/<logdir>/gi,conf.logDir);
		data = data.replace(/<rootdir>/gi,conf.rootDir);
		if( conf.sslDir ) {
			data = data.replace(/<ssldir>/gi,conf.sslDir);
		}
		if( conf.appPort ) {
			data = data.replace(/<appPort>/gi,conf.appPort);
		}

		var filepath = conf.nginxDestDir + "/" + conf.serverName;
		fs.writeFile(filepath, data , function(err) {
			if (err) throw err;
			console.log("config file written : "+filepath+"\n");
			console.log("\n");
			console.log("don't forget to reload nginx ( sudo service nginx reload )\n");
		});
	});
});
