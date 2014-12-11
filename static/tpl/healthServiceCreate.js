/*global RSVP:false */

'use strict';

var promiseXHR = function(method, url, statusOK, data) {
	var promise = new RSVP.Promise(function(resolve, reject) {
		var client = new XMLHttpRequest();
		statusOK = statusOK ? statusOK : 200;
		client.open(method, url);
		client.onreadystatechange = function handler() {
			if (this.readyState === this.DONE) {
				if (this.status === statusOK) {
					resolve(this.response);
				}
				else {
					reject(this);
				}
			}
		};
		client.send(data ? data : null);
	});

	return promise;
};

document.addEventListener('DOMContentLoaded', function() {

	// Load types of services
	promiseXHR('GET', '', 200)
	.then(function(response) {
		},
		function(error) {
			console.log(error);
		});

	// Load prescribers
	promiseXHR('GET', '', 200)
	.then(function(response) {
		},
		function(error) {
			console.log(error);
		});

	// Load providers
	promiseXHR('GET', '', 200)
	.then(function(response) {
		},
		function(error) {
			console.log(error);
		});

	var onChangeFrequency = function() {
		switch (this.value) {
			case 'monthly':
				document.getElementById('repeat-label').innerHTML = 'month';
				break;
			case 'weekly':
				document.getElementById('repeat-label').innerHTML = 'week';
				break;
			case 'daily':
				document.getElementById('repeat-label').innerHTML = 'daily';
				break;
			case 'punctual':
				document.getElementById('repeat-label').innerHTML = 'punctual';
				break;
			default:
		}
	};

	var freqRadios = document.form.frequency;
	for (var i = 0; i < freqRadios.length; i++) {
		freqRadios[i].addEventListener('change', onChangeFrequency);
	}
});