"use strict";

var fs = require("fs"),
	promise = require("rsvp").Promise,
	exec = require("child_process").exec,
	request = require("request"),
	targz = require("tar.gz");

var DB_FILE = require("path").join(__dirname, "testDB.tar.gz");
var domain = 'http://127.0.0.1:8001';   // domain name for reading cookies

function testTools(_config) {
	/**
	 * Dump the mongo database into a file
	 * 
	 * @param {String} filepath the filename to create
	 * @returns {promise} on resolve return null
	 */
	this.mongoDump = function(filepath) {
		return new promise( function(resolve, reject) {
			require("child_process").exec("mongodump -d physioDOM", function (err) {
				new targz().compress("dump", filepath, function (err) {
					if (err) {
						console.log("err", err);
						process.exit(1);
					} else {
						exec("rm -rf dump", function(err,stdout,stderr) {
							if(err) {
								reject(err);
							} else {
								resolve();
							}
						});
					}
				});
			});
		});
	};

	/**
	 * Restore the mongo database from a file
	 *
	 * @param filepath {string} the file path ( tar.gz ) to restore from
	 * @returns {promise} on resolve return null
	 */
	this.mongoRestore = function(filepath ) {
		return new promise( function(resolve, reject) {
			// Check if file exists
			fs.exists(filepath, function (exists) {
				if (!exists) {
					return reject( "mongoRestore : "+ filepath + " does not exist");
				}
				
				new targz().extract( filepath, process.cwd(), function(err) {
					if(err) {
						console.error("err", err);
						reject(err);
					} else {
						if( !fs.existsSync( "dump/physioDOM" )) {
							var error = "can't find the database to restore";
							console.error(error);
							reject(error);
						} else {
							var cmd = 'mongorestore -d physioDOM --drop dump/physioDOM/';
							cmd += ';  rm -rf dump';
							exec(cmd, function (err, stdout, stderr) {
								if (err) {
									reject(err);
								} else {
									resolve();
								}
							});
						}
					}
				});
			});
		});
	};

	/**
	 * Login function
	 * 
	 * Make a login request to the Application with the given credentials
	 * credentials is a object containing a login and a password properties.
	 * ex : { login:"test",password:"test" }
	 * 
	 * @param credentials
	 * @returns {promise}
	 */
	this.login = function( credentials ) {
		return new promise( function(resolve, reject) {
			var cookie = request.jar();
			request({
				url   : domain + '/api/login',
				method: "POST", 
				encoding           : 'utf-8',
				headers            : { "content-type":"text/plain"},
				body               : JSON.stringify(credentials),
				jar   : cookie
			}, function (err, resp, body) {
				if( resp.statusCode === 200 ) {
					resolve(cookie);
				} else {
					if(err) { 
						reject(err); 
					} else {
						try {
							reject(JSON.parse(body));
						} catch(err) {
							reject({ code:resp.statusCode, message: body });
						}
					}
				}
			});
		});
	};
	
	
	this.before = function() {
		return this.mongoRestore( DB_FILE );
	};
}

module.exports = new testTools();