"use strict";

var Utils = new Utils(),
	physiologicalData = {},
	infos = {};

physiologicalData.list = {};

window.addEventListener("DOMContentLoaded", function() {
    infos.lang = document.querySelector('#lang').innerText;
    getParamList();
}, false);

var getParamList = function() {
	var promises = {
            physiological: Utils.promiseXHR("GET", "/api/lists/parameters", 200),
            symptom: Utils.promiseXHR("GET", "/api/lists/symptom", 200),
            questionnaire: Utils.promiseXHR("GET", "/api/lists/questionnaire", 200)
        };

	RSVP.hash(promises).then(function(results) {
		physiologicalData.list.physiological = JSON.parse(results.physiological);
		physiologicalData.list.symptom = JSON.parse(results.symptom);
		physiologicalData.list.questionnaire = JSON.parse(results.questionnaire);


		var physiologicalList = physiologicalData.list.physiological.items,
			i = 0,
	        leni = physiologicalList.length,
	        symptomList = physiologicalData.list.symptom.items,
	        y = 0,
	        leny = symptomList.length,
	        questionnaireList = physiologicalData.list.questionnaire.items,
	        z = 0,
	        lenz = questionnaireList.length;

	    for(i; i<leni; i++) {
	        physiologicalList[i].labelLang = physiologicalList[i].label[infos.lang];
	    }
	    for(y; y<leny; y++) {
	        symptomList[y].labelLang = symptomList[y].label[infos.lang];
	    }
	    for(z; z<lenz; z++) {
	        questionnaireList[z].labelLang = questionnaireList[z].label[infos.lang];
	    }

		renderLine(physiologicalList, '#param-physiological-container');
		renderLine(symptomList, '#param-symptom-container');
		renderLine(questionnaireList, '#param-questionnaire-container');
	});

};

var renderLine = function(list, containerName) {
	var paramContainer = document.querySelector(containerName),
		paramLineTpl = document.querySelector('#param-line-tpl'),
		i = 0,
		len = list.length;

	for(i; i<len; i++) {
		var row = document.createElement('div'),
			model = {
				param: list[i]
			};

		row.className = 'row';
		row.innerHTML = Mustache.render(paramLineTpl.innerHTML, model);
		paramContainer.appendChild(row);
	}

};
