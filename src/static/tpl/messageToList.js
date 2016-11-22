"use strict";

/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

var app = document.querySelector("#app");
var Utils = new Utils();

app.filter = null;
app.filters = [];
app.lang = Cookies.get("lang");
app.lang = app.lang === "en"?"en-GB":app.lang;
getBeneficiaries();


function limitText(evt) {
	var contentField = evt.target;
	var lines = contentField.value.split("\n");
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].length <= 60) {
			continue;
		}
		var j = 0, space = 60;
		lines[i] = lines[i].trim();
		while (j++ <= 60) {
			if (lines[i].charAt(j) === " ") {
				space = j;
			}
		}
		lines[i + 1] = lines[i].substring(space + 1) + " " + (lines[i + 1] || "");
		lines[i] = lines[i].substring(0, space);
	}
	contentField.value = lines.slice(0, 9).join("\n");
}

// recupération des listes
function getList(obj) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "/api/lists/" + obj.list);
	xhr.onload = function () {
		var result = [];
		var list = JSON.parse(xhr.responseText);
		list = list.items;
		result = list.filter(function (item) {
			if (item.active && item.ref !== 'NONE') {
				return true;
			}
		}).map(function (item) {
			return {ref: item.ref, label: item.label['en']};
		});
		if (result.length) {
			app[obj.list] = result;
		} else {
			document.querySelector("core-selector [name='" + obj.name + "']").hidden = true;
		}
	}
	xhr.send();
}

[
	{name: 'main', list: 'diagnosis'},
	{name: 'dependant', list: 'generalStatus'},
	{name: 'undernitrition', list: 'nutritionalStatus'},
	{name: 'perimeter', list: 'perimeter'}
].map(function (listName) {
	getList(listName);
});
//getList("diagnosis");

function addFilter() {
	var tmp;
	var filter = {filter: '', value: '', label: '', display: '', name: app.filter};
	switch (app.filter) {
		case 'city' :
			filter.value = document.querySelector('core-pages .core-selected input').value;
			filter.label = 'City';
			filter.filter = 'address.city';
			filter.display = filter.value;
			break;
		case "start":
			filter.value = document.querySelector('core-pages .core-selected zdk-input-date').value;
			filter.label = 'Start date';
			filter.filter = 'entry.startDate';
			filter.display = moment(filter.value).format("L");
			break;
		default:
			filter.value = document.querySelector('core-pages .core-selected select').value;
			tmp = document.querySelector('core-pages .core-selected select').selectedOptions[0].innerHTML;
			filter.display = tmp;
			switch (app.filter) {
				case 'main':
					filter.label = 'Main diagnosis';
					filter.filter = 'diagnosis.chronic.main';
					break;
				case 'undernitrition':
					filter.label = 'Undernitrition status';
					filter.filter = 'diagnosis.nutritional';
					break;
				case 'dependant':
					filter.label = 'Dependant';
					filter.filter = 'diagnosis.general';
					break;
				case 'gender':
					filter.label = 'Gender';
					filter.filter = 'gender';
					break;
				case 'perimeter':
					filter.label = 'Perimeter';
					filter.filter = 'perimeter';
					break;
			}
	}
	document.querySelector("core-selector [name='" + app.filter + "']").hidden = true;
	// app.filters.push({filter:app.filter, value: value, label: label });
	app.filters.push(filter);
	app.filter = null;
	getBeneficiaries();
}

function rmFilter(index) {
	if(app.filters[index].name === "city") {
		document.querySelector('core-pages div[name="city"] input').value = "";
	}
	if(app.filters[index].name === "start") {
		document.querySelector('core-pages div[name="start"] zdk-input-date').value = null;
	}
	document.querySelector("core-selector [name='" + app.filters[index].name + "']").hidden = false;
	app.filters.splice(index, 1);

	getBeneficiaries();
}

function getBeneficiaries() {
	var filter = {};
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "/api/beneficiaries/filter");
	xhr.onload = function () {
		var list = JSON.parse(xhr.responseText);
		app.number = list.length;
		app.beneficiaries = list;
	};
	app.filters.forEach(function (item) {
		filter[item.filter] = item.value;
	});
	console.log(filter);
	//xhr.send(JSON.stringify({gender:"M", 'diagnosis.general':'PRE-FRAILTY','diagnosis.nutritional' : "UNDERN" }));
	xhr.send(JSON.stringify(filter));
}

function checkForm() {
	var form = document.forms.message;
	var invalid, btn;

	if (!form.checkValidity()) {
		invalid = true;
		btn = document.querySelector("#sendBtn");
		if (btn) {
			btn.click();
		}
	}

	if (invalid) {
		if (Utils.isSafari()) {
			var log = "", label = "";
			var elt = document.querySelector("*:required:invalid");
			elt.scrollIntoView();
			if (elt.value) {
				if (elt.min) {
					log = "the value must be greater than " + elt.min;
				}
				if (elt.max) {
					log = "the value must be lower than " + elt.max;
				}
				if (elt.min && elt.max) {
					log = "the value must be between " + elt.min + " and " + elt.max;
				}
			} else {
				log = "must not be empty";
			}

			if (elt.id && document.querySelector("label[for='" + elt.id + "']")) {
				label = document.querySelector("label[for='" + elt.id + "']").innerHTML;
				log = "<b>The field '" + label + "'</b><br/>" + log;
			}
			new Modal('emptyRequired', null, log);
		}
		return false;
	} else {
		sendMessage();
		// return true;
	}
}

function sendMessage() {
	// if app.number is 0 show a warning dialog box and return
	[].slice.call(document.querySelectorAll("form button"))
		.map(function(button) { 
			button.disabled = true; 
		});
	if(!app.number) {
		return new Modal('errorNoBeneficiaries', null);
	}
	var obj = form2js(document.forms.message);
	var msg = {
		message  : {
			title  : obj.title,
			author : obj.author,
			content: obj.content
		}, 
		filter: {}
	};

	function enableForm() {
		[].slice.call(document.querySelectorAll("form button"))
			.map(function(button) {
				button.disabled = false;
			});
	}
	
	app.filters.forEach(function (item) {
		msg.filter[item.filter] = item.value;
	});
	
	fetch('/api/beneficiaries/message', {
		method     : 'POST',
		credentials: 'include',
		body       : JSON.stringify(msg)
	})
		.then(function (resp) {
			if (resp.ok) {
				new Modal('sendSuccess', function() {
					resetForm();
					enableForm();
				});
			} else {
				new Modal('errorOccured', function() {
					enableForm();
				});
			}
		});
}

function toggleBeneficiaries() {
	var div = document.querySelector('.beneficiaries');
	div.classList.toggle('hidden');
	var btn = document.querySelector('#beneficiariesBtn core-icon');
	btn.icon = div.classList.contains('hidden') ? 'arrow-drop-down' : 'arrow-drop-up';
}

function resetForm() {
	app.filters.map( function(filter) {
		document.querySelector("core-selector [name='" + filter.name + "']").hidden = false;
	});
	app.filters = [];
	app.$.title.value = "";
	app.$.content.value = "";
	getBeneficiaries();
}