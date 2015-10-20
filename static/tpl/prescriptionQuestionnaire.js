"use strict";

/* global Cookies, moment, form2js, RSVP, Modal, Utils, Mustache */

var utils = new Utils(),
	infos = {},
	questionnairePlan = [],
	idx = 0,
	dateIdx = 0,
	modified = false;

/**
 * Data Binding / Templating
 */

function init() {
	var questionnaireProgTpl = document.querySelector('#tpl-questionnaire-prog'),
		questionnaireProgContainer = document.querySelector('.questionnaire-prog-list');

	function setAddedDate() {
		return function (val, render) {
			var dateAddedTpl = document.querySelector('#dateAddedTpl');
			var dateIndex = dateIdx;
			dateIdx++;
			var data = {
				dateValue  : render(val),
				dateDisplay: moment(render(val)).format("L"),
				idx        : idx,
				dateIdx    : dateIndex
			};
			return Mustache.render(dateAddedTpl.innerHTML, data);
		};
	}

	for(var i = 0; i<questionnairePlan.length; i++) {
		var dataItem = questionnairePlan[i];
		questionnairePlan[i].labelLang = dataItem.label[infos.lang] || dataItem.label || dataItem.ref;
	}


	for (var i = 0, len = questionnairePlan.length; i < len; i++) {
		var dataItem = questionnairePlan[i];

		var dataModel = {
			idx         : idx,
			lang        : infos.lang === "en" ? "en_gb":infos.lang ,
			data        : dataItem,
			dataList 	: questionnairePlan,
			disable: function() {
				return function (val, render) {
					if(dataItem.ref === render(val)) {
						return 'disabled';
					}
			};
		},
			setAddedDate: setAddedDate
		};

		var questionnaireContainer = document.createElement("div");
		questionnaireContainer.classList.add('data-item');
		questionnaireContainer.innerHTML = Mustache.render(questionnaireProgTpl.innerHTML, dataModel);

		questionnaireProgContainer.appendChild(questionnaireContainer);
		idx++;
	}

	var inputs = document.querySelectorAll("input");
	[].slice.call(inputs).forEach(function (input) {
		input.addEventListener("change", function (evt) {
			modified = true;
		}, false);
	});
}

function copySelection(refTo, elt) {
	if(!elt.value) {
		return;
	}
	var containerTo = document.querySelector('#'+refTo),
		containerFrom = document.querySelector('#'+elt.value);

	containerTo.querySelector('.data-frequency').value = containerFrom.querySelector('.data-frequency').value;
	containerTo.querySelector('.data-comment').value = containerFrom.querySelector('.data-comment').value;
	containerTo.querySelector('.dates-list').innerHTML = containerFrom.querySelector('.dates-list').innerHTML;

	var datesContainer = containerTo.querySelector('.dates-list'),
		dates = datesContainer.querySelectorAll('li');

	for(var i = 0; i< dates.length; i++) {
		var inputDate = dates[i].querySelector('input[type="hidden"]');
		inputDate.name = 'questionnaire['+ datesContainer.id +'].date['+ i +']';
	}

	elt.querySelectorAll('option')[0].selected = true;
}

function addDate(elt, idx) {
	var div = document.querySelector("div#"+elt);
	var dateValue = div.querySelector("zdk-input-date").value,
		dateContainer = div.querySelector('.dates-list'),
		dateAddedTpl = document.querySelector('#dateAddedTpl'),
		dateAddedList = dateContainer.querySelectorAll('.date-added'),
		dateMoment = moment(dateValue);

	if(!dateValue) { return; } else {
		console.log( dateValue );
	}
	
	if (dateMoment.isBefore()) {
		new Modal('errorDateOld');
		return;
	}

	for (var i in dateAddedList) {
		if (dateAddedList[i].value === dateValue) {
			new Modal('errorDateExist');
			return;
		}
	}

	if (dateValue && utils.parseDate(dateValue)) {
		var data = {
			dateValue  : dateValue,
			dateDisplay: moment(dateValue).format("L"),
			idx        : idx,
			dateIdx    : dateIdx
		};
		var frag = document.createElement("template");
		frag.innerHTML = Mustache.render(dateAddedTpl.innerHTML, data);
		var li = frag.content.querySelector("li");
		var lis =[].slice.call(dateContainer.querySelectorAll("li"));
		
		if( !lis.length ) { 
			dateContainer.appendChild(li); 
		} else {
			for( i=0; i<lis.length; i++ ) {
				if( lis[i].getAttribute("data-date") > dateValue ) { break; }
			}
			if( i === lis.length ) {
				dateContainer.appendChild(li);
			} else {
				dateContainer.insertBefore(li, lis[i]);
			}
		}
		
		div.querySelector("zdk-input-date").value = "";
		dateIdx++;
		modified = true;
	}
}

function removeDate(elt) {
	var li = elt.parentNode,
		dateContainer = li.parentNode;

	dateContainer.removeChild(li);
	modified = true;
}

/**
 * Action on form
 */

function saveData() {
	//Call to API (No API defined yet)
	var data = form2js(document.querySelector("form[name=questionnaire]")); // document.forms.questionnaire);
	var promises = data.questionnaire.map(function (questionnaire) {
		return utils.promiseXHR("PUT", "/api/beneficiary/questprog", 200, JSON.stringify(questionnaire))
	});

	RSVP.all(promises)
		.then(function () {
			console.log("all saved");
			modified = false;
			new Modal('saveSuccess', function () {
			});
		})
		.catch(function () {
			new Modal('errorOccured', function () {
			});
		});
}

/**
 * Getting questionnaireProg
 */

var getList = function () {
	utils.promiseXHR("GET", "/api/beneficiary/questprog", 200)
		.then(function (results) {
			questionnairePlan = JSON.parse(results);
			init();
		});
};

window.addEventListener("DOMContentLoaded", function () {
	infos.lang = Cookies.get("lang");
	moment.locale(infos.lang === "en" ? "en_gb" : infos.lang);

	var zdkInputDates = document.querySelectorAll("zdk-input-date");
	[].slice.call(zdkInputDates).forEach(function (elt) {
		elt.setAttribute("i18n", Cookies.get("lang")=="en"?"en_gb":Cookies.get("lang"));
	});
	
	getList();

}, false);

window.addEventListener("beforeunload", function (e) {
	var confirmationMessage;
	if (modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});