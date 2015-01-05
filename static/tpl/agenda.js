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

document.addEventListener('polymer-ready', function() {

	// Load event data
	promiseXHR('GET', '/events.json', 200)
	.then(function(response) {
			document.getElementById('agenda').events = JSON.parse(response);
		},
		function(error) {
			console.log(error);
		});

	// Handle clicks on event items
	document.getElementById('agenda').addEventListener('zdk-event-click', function(e) {

		var data = e.detail.event;

		// TODO: remove with REST calls

		var service = {};
		service.ref = data.label;
		service.startDate = moment('2014-12-15', 'YYYY-MM-DD').format('L');
		service.endDate = moment('2014-12-31', 'YYYY-MM-DD').format('L');
		service.provider = 'CHAZAL C.';

		switch (data.serviceID) {
			case 1:
				service.detail = 'Description of the care to make';
				service.frequency = 'weekly';
				service.when = [
					{
						day: 'monday',
						time: '9:00'
					},
					{
						day: 'wednesday',
						time: '9:00'
					},
					{
						day: 'friday',
						time: '9:00'
					},
				];
				break;
			case 2:
				service.detail = 'Description of the assistance';
				service.frequency = 'daily';
				service.weekEnd = true;
				service.when = {time: '12:00'};
				break;
			case 3:
				service.detail = 'Description of the service';
				service.frequency = 'weekly';
				service.when = [
					{
						day: 'tuesday',
						time: '18:00'
					},
					{
						day: 'thursday',
						time: '18:00'
					},
					{
						day: 'saturday',
						time: '18:00'
					},
				];
				break;
		}

		service.isDaily = service.frequency === 'daily';

		var dialogEventTemplate = document.getElementById('dialog-event-template').innerHTML;
		Mustache.parse(dialogEventTemplate);
		var rendered = Mustache.render(dialogEventTemplate, {service: service});
		document.getElementById('dialog-event').innerHTML = rendered;

		var eventDialog = document.getElementById('dialog-event');
		eventDialog.show();

		/*promiseXHR("GET", "/api/", 200)
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
				
			});*/
	});
});