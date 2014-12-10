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

document.addEventListener('polymer-ready', function() {

	// Handle clicks on event items
	document.getElementById('agenda').addEventListener('zdk-event-click', function(e) {
		// Load event data
		promiseXHR("GET", "/api/", 200)
			.then(function(response) {

				var e = response;
				
				var dialogEventTemplate = document.getElementById('dialog-event-template').innerHTML;
				Mustache.parse(dialogEventTemplate);
				var rendered = Mustache.render(dialogEventTemplate, {e: e});
				document.getElementById('dialog-event').innerHTML = rendered;

				var eventDialog = document.getElementById('dialog-event');
				eventDialog.show();
			},
			function(error) {
				
			});
	});
});