/*global RSVP:false, renderTemplate:false, moment:false */

'use strict';

var frequency = 'daily';
var days = [];
var agenda = null;
var services = null; // list of services

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

/**
 * Tells if a given day in the agenda contains at least one event
 * @param  {String}  day String representation of the day (YYYY-MM-DD)
 * @return {Boolean}     True if the given day contains an event
 */
function hasEvent(day) {

	for (var i = 0, length = agenda.events.length; i < length; i++) {
		if (moment(agenda.events[i].start, moment.ISO_8601).format('YYYY-MM-DD') === day) {
			return true;
		}
	}
	return false;
}

function setFrequency(newFrequency) {
	frequency = newFrequency;

	var data = {
		frequency: frequency,
		daily: newFrequency === 'daily',
		weekly: newFrequency === 'weekly',
		monthly: newFrequency === 'monthly',
		punctual: newFrequency === 'punctual'
	};

	switch (frequency) {
		case 'monthly':
			data.repeatLabel = 'month';
			document.getElementById('dates-block').style.display = '';
			break;
		case 'weekly':
			data.repeatLabel = 'week';
			document.getElementById('dates-block').style.display = '';
			break;
		case 'daily':
			data.repeatLabel = 'daily';
			document.getElementById('dates-block').style.display = '';
			break;
		case 'punctual':
			data.repeatLabel = 'punctual';
			document.getElementById('dates-block').style.display = 'none';
			break;
		default:
	}

	data.hours = [];
	for (var i = 0; i < 24; i++) {
		data.hours.push(i + ':00');
		data.hours.push(i + ':30');
	}

	renderTemplate('special-inputs', 'special-inputs-template', data);
}

function onBtnCalWeekClick() {
	agenda.view = 'week';

	agenda.today();
	agenda.next();
	document.getElementById('dialog-agenda').show();
	agenda.drawBG();
	agenda.setTime();
	agenda.drawEvents();

	// Load events
	var events = [];
	for (var i = 0, length = days.length; i < length; i++) {
		var time = moment(days[i].time, 'HH:mm');
		var day = moment(agenda.day).startOf('week');
		day.add(days[i].day - 1, 'days');
		day.hour(time.hour());
		day.minute(time.minute());

		events.push({
			className: 'event1',
			label: '',
			start: day.toISOString(),
			end: moment(day).add(document.form.duration.value, 'minutes').toISOString()
		});
	}

	agenda.events = events;
}

function onBtnCalMonthClick() {
	agenda.view = 'month';

	agenda.today();
	agenda.next();
	document.getElementById('dialog-agenda').show();
	agenda.drawBG();

	// Load events
	var events = [];
	for (var i = 0, length = days.length; i < length; i++) {
		var time = moment(document.form['start-time'].value, 'HH:mm');
		var day = moment(agenda.day).startOf('month');
		day.add(days[i] - 1, 'days');
		day.hour(time.hour());
		day.minute(time.minute());

		events.push({
			className: 'event1',
			label: '',
			start: day.toISOString(),
			end: moment(day).add(document.form.duration.value, 'minutes').toISOString()
		});
	}

	agenda.events = events;
}

document.addEventListener('DOMContentLoaded', function() {

	setFrequency('daily');

	// Load types of services
	promiseXHR('GET', '/api/lists/healthServices', 200)
	.then(function(response) {
			services = JSON.parse(response).items;
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
		document.getElementById('dialog-warning-frequency').show();
	};

	var freqRadios = document.form.frequency;
	for (var i = 0; i < freqRadios.length; i++) {
		freqRadios[i].addEventListener('change', onChangeFrequency);
	}

	document.getElementById('btn-warning-cancel').addEventListener('click', function() {

		// Select the previous frequency
		document.form.frequency.value = frequency;

		// Hide the warning dialog
		document.getElementById('dialog-warning-frequency').hide();
	});

	document.getElementById('btn-warning-confirm').addEventListener('click', function() {

		setFrequency(document.form.frequency.value);
		days = [];

		// Hide the warning dialog
		document.getElementById('dialog-warning-frequency').hide();
	});

	document.getElementById('btn-cal-cancel').addEventListener('click', function() {

		// Hide the agenda dialog
		document.getElementById('dialog-agenda').hide();

		// Empty the agenda
		if (agenda) {
			agenda.events = [];
		}
	});

	document.getElementById('btn-cal-confirm').addEventListener('click', function() {

		var day, i, length, stringDays;
		switch (agenda.view) {
			case 'month':
				days = [];
				day = moment(agenda.day).startOf('month');
				var month = day.month();

				while (day.month() === month) {

					if (hasEvent(day.format('YYYY-MM-DD'))) {
						days.push(day.date());
					}

					day.add(1, 'day');
				}

				stringDays = [];
				for (i = 0, length = days.length; i < length; i++) {
					stringDays.push(moment(days[i], 'DD').format('Do'));
				}
				renderTemplate('days-month', 'days-month-template', {days: stringDays});
				break;
			case 'week':
				days = [];
				stringDays = [];
				day = moment(agenda.day).startOf('week');

				for (i = 0, length = agenda.events.length; i < length; i++) {
					days.push({
						day: moment(agenda.events[i].start, moment.ISO_8601).day(),
						time: moment(agenda.events[i].start, moment.ISO_8601).format('HH:mm')
					});
					stringDays.push({
						day: moment(agenda.events[i].start, moment.ISO_8601).format('dddd'),
						time: moment(agenda.events[i].start, moment.ISO_8601).format('HH:mm')
					});
				}

				renderTemplate('days-week', 'days-week-template', {days: stringDays});
				break;
		}

		// Hide the agenda dialog
		document.getElementById('dialog-agenda').hide();
	});

	document.getElementById('btn-cal-add').addEventListener('click', function() {

		if (!agenda) {
			return;
		}

		var time, day;
		switch (agenda.view) {
			case 'month':
				time = moment(document.form['start-time'].value, 'HH:mm');
				day = moment(agenda.day).startOf('month');
				day.hour(time.hour());
				day.minute(time.minute());
				var month = day.month();

				while (hasEvent(day.format('YYYY-MM-DD')) && day.month() === month) {
					day.add(1, 'day');
				}

				if (day.month() === month) {
					// Add an event
					agenda.events.push({
						className: 'event1',
						label: '',
						start: day.toISOString(),
						end: moment(day).add(document.form.duration.value, 'minutes').toISOString()
					});
				}
				break;

			case 'week':
				time = moment(agenda.hourShow, 'HH:mm');
				day =  moment(agenda.day).startOf('week');
				day.hour(time.hour());
				day.minute(time.minute());
				var week = day.week();

				while (hasEvent(day.format('YYYY-MM-DD')) && day.week() === week) {
					day.add(1, 'day');
				}

				if (day.week() === week) {
					// Add an event
					agenda.events.push({
						className: 'event1',
						label: '',
						start: day.toISOString(),
						end: moment(day).add(document.form.duration.value, 'minutes').toISOString()
					});
				}
				break;
		}
	});
});

document.addEventListener('polymer-ready', function() {
	agenda = document.getElementById('agenda');

	agenda.addEventListener('zdk-event-close', function(e) {
		console.log(e.detail.event);
		agenda.events.splice(e.detail.event.num, 1);

		console.log(agenda.events);
	});
});