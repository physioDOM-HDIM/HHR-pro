'use strict';

var Utils = new Utils(),
	modified = false,
	datas = {},
	infos = {},
	lists= {};


/**
 * UI
 */

function computeBMI() {
	var size = parseFloat(document.getElementById('sizeInput').value);
	var weight = parseFloat(document.getElementById('weightInput').value);

	if (isNaN(size) || isNaN(weight) || size === 0 || weight === 0) {
		document.getElementById('bmiInput').value = '';
	}
	else {
		var bmi = weight / (size * size);
		document.querySelector("[data-name=BMI] .value-input").value = bmi.toFixed(2);
		document.querySelector("[data-name=BMI] .value-date").innerHTML = "";
		document.querySelector("[data-name=BMI] .param-date").value = moment().format("YYYY-MM-DD");
	}
}

function showConfirm() {
	var formElt = document.getElementById('formDiet');

	if(!formElt.checkValidity()) {

		if( Utils.isSafari() ) {
			var log = "", label = "";
			var elt = document.querySelector("*:required:invalid");
			elt.scrollIntoView();
			elt.focus(true);
			if( elt.value ) {
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

			label = elt.parentNode.querySelector(".value-name");
			if( label ) {
				log = "<b>The field '"+ label.innerHTML +"'</b><br/>" + log;
			}
			new Modal('emptyRequired', null, log);
		}
		
		return;
	}

	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}

/**
 * ACTIONS
 */

function addAssistance() {
	var container = document.querySelector('#assistanceValues'),
		template = document.querySelector('#assistanceLine'),
		modelData = {
			idx: ++datas.idxValue,
			assistanceList: datas.assistanceList
		},
		line = document.createElement('div');

	line.className = 'row value-row';
	line.innerHTML = Mustache.render(template.innerHTML, modelData);

	container.appendChild(line);
}

function removeAssistance(elt) {
	var assistance = elt.parentNode,
		container = assistance.parentNode;

	container.removeChild(assistance);
}

function addValue (valueName, formObj, isFloat) {

	if(formObj[valueName] && (datas.savedData[valueName] !== formObj[valueName])) {
		var todayDate = moment().format('L'),
		dateContainer = document.querySelector('.'+valueName+'Date');

		dateContainer.innerHTML = todayDate;

		formObj[valueName+'Date'] = todayDate;
	}

	if (formObj[valueName] && isFloat) {
		formObj[valueName] = parseFloat(formObj[valueName]);
	}
}

function saveDatas(validate) {
	var formElt = document.getElementById('formDiet');
	if(!formElt.checkValidity()) {

		if( Utils.isSafari() ) {
			var log = "", label = "";
			var elt = document.querySelector("*:required:invalid");
			elt.scrollIntoView();
			elt.focus(true);
			if( elt.value ) {
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

			label = elt.parentNode.querySelector(".value-name");
			if( label ) {
				log = "<b>The field '"+ label.innerHTML +"'</b><br/>" + log;
			}
			new Modal('emptyRequired', null, log);
		}
		
		return false;
	}

	var formObj = form2js(formElt);

	addValue('size', formObj, true);
	
	if(!formObj.assistance) {
		formObj.assistance = [];
	}
	
	if(!formObj.dietPresc) {
		formObj.dietPresc = { prescription : "", comment: "" };
	} else if (!formObj.dietPresc.prescription ) {
		formObj.dietPresc.prescription = "";
	}

	if( formObj.questionnaires ) {
		formObj.questionnaires.forEach(function (questionnaire) {
			if (!questionnaire.answerID) {
				questionnaire.answerID = null;
				questionnaire.date = null;
				questionnaire.score = null;
			} else {
				questionnaire.score = parseInt(questionnaire.score, 10);
			}
			if (!questionnaire.comment) {
				questionnaire.comment = "";
			}
		});
	}

	if( formObj.parameters ) {
		formObj.parameters.forEach(function (parameter) {
			if (!parameter.value) {
				parameter.value = null;
				parameter.date = null;
			} else {
				if (!parameter.date) {
					parameter.date = moment().format("YYYY-MM-DD");
				}
			}
			if (!parameter.comment) {
				parameter.comment = "";
			}
		});
	}
	
	if(!validate) {
		sendDatas(formObj, function() {
			new Modal('saveSuccess', function() {
				modified = false;
				window.location.href = '/current/nutrition';
			});
		});
	} else {
		return formObj;
	}
}

function paramChange( obj, oldValue) {
	if( obj.value !== oldValue ) {
		obj.parentNode.querySelector(".value-date").innerHTML = "";
		obj.parentNode.querySelector(".param-date").value = moment().format("YYYY-MM-DD");
	}
	if( obj.value ) {
		obj.required = true;
	} else {
		obj.required = null;
	}
}

function validate() {
	var formObj = saveDatas(true);

	formObj.validated = true;
	formObj.validatedDate = moment().format('YYYY-MM-DD');

	sendDatas(formObj, function(res) {
		new Modal('saveSuccess', function() {
			modified = false;
			window.location.href = '/current/nutrition';
		});
	});
}

function sendDatas(formObj, callback) {
	Utils.promiseXHR('PUT', '/api/beneficiary/current/nutrition', 200, JSON.stringify(formObj))
		.then(function(res) {
			if(callback) {
				callback(res);
			}
		}, function() {
			new Modal('errorOccured');
			console.log(error);
		});
}

/**
 * INIT
 */

function getAssistanceList(callback) {

	var promises = {
		healthServicesList: Utils.promiseXHR('GET', '/api/lists/healthServices', 200),
		socialServicesList: Utils.promiseXHR('GET', '/api/lists/socialServices', 200)
	};

	RSVP.hash(promises)
		.then(function (results) {

			var healthList = JSON.parse(results.healthServicesList),
				socialList = JSON.parse(results.socialServicesList),
				assistanceList = [],
				getDietValues = function (parsedList) {
					var list = parsedList.items;
					for(var i in list) {
						if(list[i].diet) {
							list[i].labelLang = list[i].label[Cookies.get("lang")];
							assistanceList.push(list[i]);
						}
					}
				};

			getDietValues(healthList);
			getDietValues(socialList);

			datas.assistanceList = assistanceList;

			//replacing assistance ref by labelLang
			var assistanceRefList = document.querySelectorAll('.assistance-label');

			for(var i in assistanceRefList) {
				var assistance = Utils.findInObject(datas.assistanceList, 'ref', assistanceRefList[i].innerHTML);

				if(assistance.labelLang) {
					assistanceRefList[i].innerHTML = assistance.labelLang;
				}
			}

		});
}

function getLists() {
	var promises = {
		params: Utils.promiseXHR("GET", "/api/lists/parameters", 200),
		quests: Utils.promiseXHR("GET", "/api/lists/questionnaire", 200),
		units: Utils.promiseXHR("GET", "/api/lists/units", 200)
	};

	RSVP.hash(promises)
		.then(function (results) {
			var params = JSON.parse(results.params).items;
			var quests = JSON.parse(results.quests).items;
			var unitsList = JSON.parse(results.units).items;
			
			var i = 0,
				leni = params.length;
			
			for (i; i < leni; i++) {
				var y = 0,
					leny = unitsList.length;
	
				for (y; y < leny; y++) {
					if ( params[i].units === unitsList[y].ref) {
						params[i].unitsLabel = unitsList[y].label[infos.lang]?unitsList[y].label[infos.lang]:unitsList[y].label["en"];
						break;
					}
				}
			}
			
			lists.params = {};
			lists.quests = {};
			params.forEach( function(param) {
				lists.params[param.ref] = param;
			});
			quests.forEach( function(quest) {
				lists.quests[quest.ref] = quest;
			});
			console.log(lists);
	
			quests = document.querySelector(".questionnaires");
			[].slice.call(quests.querySelectorAll("[data-name]")).forEach( function(quest) {
				var name = quest.getAttribute("data-name");
				quest.querySelector(".quest-name").innerHTML = lists.quests[name].label[infos.lang];
			});
			params = document.querySelector(".parameters");
			[].slice.call(params.querySelectorAll("[data-name]")).forEach( function(param) {
				var name = param.getAttribute("data-name");
				param.querySelector(".value-name").innerHTML = lists.params[name].label[infos.lang];
				param.querySelector(".value-unit").innerHTML = lists.params[name].unitsLabel || "";
				param.querySelector(".value-input").min = lists.params[name].range.min;
				param.querySelector(".value-input").max = lists.params[name].range.max;
				param.querySelector(".value-input").step = lists.params[name].precision?"any":1;
			});
		});
}

window.addEventListener('DOMContentLoaded', function() {
	moment.locale(Cookies.get("lang")=="en"?"en-gb":Cookies.get("lang"));
	infos.lang = Cookies.get("lang");
	document.getElementById('sizeInput').addEventListener('change', computeBMI);
	document.getElementById('weightInput').addEventListener('change', computeBMI);
	document.addEventListener('change', function( evt ) {
		modified = true;
	}, true );

	datas.idxValue = document.querySelector('#idxValue').innerHTML;
    getAssistanceList();
	getLists();
	
    datas.savedData = form2js(document.getElementById('formDiet'));

    //init lockdown
    datas.validateStatus = (document.querySelector('#validate-status').innerHTML === 'true');
    if(datas.validateStatus) {
    	Utils.lockdown();
    }

	var xhr = new XMLHttpRequest();
	xhr.open("GET","/api/beneficiary/current/validation", true );
	xhr.onload = function() {
		if( xhr.status === 200 ) {
			try {
				var isValid = JSON.parse(xhr.responseText);
				if( isValid.isValid) {
					parent.enableDataRecord( isValid.isValid );
				}
			} catch(err) {}
		}
	};
	xhr.send();

});

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

