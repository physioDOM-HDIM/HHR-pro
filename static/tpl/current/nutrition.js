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

	//validateChecking();
}

function showConfirm() {
	var formElt = document.getElementById('formDiet');

	if(!formElt.checkValidity()) {
		return;
	}

	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}

// function validateChecking() {
// 	var validateButton = document.querySelector('.validate-button');

// 	if(validateButton) {
// 		var formObj = form2js(document.getElementById('formDiet'));
// 		validateButton.disabled = (!formObj.weight || !formObj.lean || !formObj.bmi || !formObj.mnaAnswer || !formObj.mnaSfAnswer || !formObj.snaqAnswer || !formObj.dhdAnswer);
// 	}
// }

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
		return;
	}

	var formObj = form2js(formElt);

	addValue('size', formObj, true);
	addValue('weight', formObj, true);
	addValue('lean', formObj, true);
	addValue('bmi', formObj, true);

	addValue('dietPresc', formObj, false);

	if(!formObj.assistance) {
		formObj.assistance = [];
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

window.addEventListener('DOMContentLoaded', function() {
	moment.locale(Cookies.get("lang")=="en"?"en-gb":Cookies.get("lang"));
	document.getElementById('sizeInput').addEventListener('change', computeBMI);
	document.getElementById('weightInput').addEventListener('change', computeBMI);
	document.addEventListener('change', function( evt ) {
		modified = true;
	}, true );

	datas.idxValue = document.querySelector('#idxValue').innerHTML;
	var inputList = document.querySelectorAll('input');

	// for(var i=0; i<inputList.length; i++) {
 //        inputList[i].addEventListener('input', validateChecking, false);
 //    }

    //validateChecking();
    getAssistanceList();

    datas.savedData = form2js(document.getElementById('formDiet'));

    //init lockdown
    datas.validateStatus = (document.querySelector('#validate-status').innerHTML === 'true');
    if(datas.validateStatus) {
    	Utils.lockdown();
    }

});

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

