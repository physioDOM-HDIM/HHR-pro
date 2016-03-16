"use strict";

var fs = require("fs"),
	Promise = require("rsvp").Promise,
	request = require("request");

function testTools(_config) {
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
	this.login = function (credentials) {
		return new Promise(function (resolve, reject) {
			var cookie = request.jar();
			request({
				url     : domain + '/api/login',
				method  : "POST",
				encoding: 'utf-8',
				headers : {"content-type": "text/plain"},
				body    : JSON.stringify(credentials),
				jar     : cookie
			}, function (err, resp, body) {
				if (resp.statusCode === 200) {
					resolve(cookie);
				} else {
					if (err) {
						reject(err);
					} else {
						try {
							reject(JSON.parse(body));
						} catch (err) {
							reject({code: resp.statusCode, message: body});
						}
					}
				}
			});
		});
	};

	this.logout = function () {
		return new Promise(function (resolve, reject) {
			var cookie = request.jar();
			request({
				url     : domain + '/api/logout',
				method  : "GET",
				encoding: 'utf-8',
				headers : {"content-type": "text/plain"},
				jar     : cookie
			}, function (err, resp, body) {
				if (resp.statusCode === 200) {
					resolve(cookie);
				} else {
					if (err) {
						reject(err);
					} else {
						try {
							reject(JSON.parse(body));
						} catch (err) {
							reject({code: resp.statusCode, message: body});
						}
					}
				}
			});
		});
	};
}

module.exports = new testTools();