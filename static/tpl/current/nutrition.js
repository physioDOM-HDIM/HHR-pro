'use strict';

var Utils = new Utils(),
	modified = false,
	datas = {};


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
		document.getElementById('bmiInput').value = bmi.toFixed(2);
	}

	validateChecking();
}

function showConfirm() {
	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}

function validateChecking() {
	var validateButton = document.querySelector('.validate-button');

	if(validateButton) {
		var formObj = form2js(document.getElementById('formDiet'));
		validateButton.disabled = (!formObj.weight || !formObj.lean || !formObj.bmi || !formObj.mnaAnswer || !formObj.mnaSfAnswer || !formObj.snaqAnswer || !formObj.dhdAnswer);
	}
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

function saveAssistance(validate) {
	var formObj = form2js(document.getElementById('formAssistance'));

	for(var i in formObj.assistance) {
		formObj.assistance[i].active = (formObj.assistance[i].active !== undefined && formObj.assistance[i].active === 'on');
	}

	if(!formObj.assistance) {
		formObj.assistance = [];
	}

	if(!validate) {
		sendDatas(formObj, function() {
			new Modal('saveSuccess');
			modified = false;
		});
	} else {
		return formObj.assistance;
	}
	
}

function saveDiet(validate) {
	var formObj = form2js(document.getElementById('formDiet'));

	if (formObj.size) {
		formObj.size = parseFloat(formObj.size);
	}

	if (formObj.weight) {
		formObj.weight = parseFloat(formObj.weight);
	}

	if (formObj.lean) {
		formObj.lean = parseFloat(formObj.lean);
	}

	if (formObj.bmi) {
		formObj.bmi = parseFloat(formObj.bmi);
	}

	if(!validate) {
		sendDatas(formObj, function() {
			new Modal('saveSuccess');
			modified = false;
		});
	} else {
		return formObj;
	}
}

function validate() {
	var formObj = saveDiet(true);

	formObj.assistance = saveAssistance(true);
	formObj.validated = true;

	sendDatas(formObj, function(res) {
		if (JSON.parse(res).validated) {
			document.getElementById('buttons').innerHTML = '';

			var inputs = document.querySelectorAll('input');
			for (var i = 0; i < inputs.length; ++i) {
				if(Utils.hasClass(inputs[i], 'to-disable')) {
					inputs[i].setAttribute('disabled', true);
				}
			}

			var textareas = document.querySelectorAll('textarea');
			for (i = 0; i < textareas.length; ++i) {
				if(Utils.hasClass(textareas[i], 'to-disable')) {
					textareas[i].setAttribute('disabled', true);
				}
			}
		}
		new Modal('saveSuccess');
		modified = false;
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

window.addEventListener('DOMContentLoaded', function() {
	document.getElementById('sizeInput').addEventListener('change', computeBMI);
	document.getElementById('weightInput').addEventListener('change', computeBMI);
	document.addEventListener('change', function( evt ) {
		modified = true;
	}, true );

	datas.idxValue = document.querySelector('#idxValue').innerHTML;
	var inputList = document.querySelectorAll('input');

	for(var i=0; i<inputList.length; i++) {
        inputList[i].addEventListener('input', validateChecking, false);
    }

    validateChecking();
    getAssistanceList();
});

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

