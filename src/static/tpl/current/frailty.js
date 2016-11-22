'use strict';

var Utils = new Utils(),
	modified = false,
	datas = {},
	infos = {},
	lists= {};

window.addEventListener('DOMContentLoaded', function() {
	moment.locale(Cookies.get("lang")==="en"?"en-gb":Cookies.get("lang"));
	infos.lang = Cookies.get("lang");
	document.addEventListener('change', function( evt ) {
		modified = true;
	}, false );

	getLists();
	
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
	
}, false);

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

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

function checkForm(validate) {
	var formObj = form2js(document.getElementById('form'));

	if( formObj.questionnaires ) {
		formObj.questionnaires.forEach(function (questionnaire) {
			if (!questionnaire.answerID) {
				questionnaire.answerID = null;
				questionnaire.date = null;
				questionnaire.score = null;
				questionnaire.comment = "";
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
	
	if(validate) {
		formObj.validated = validate;
		formObj.validatedDate = moment().format('YYYY-MM-DD');
	}
	
	promiseXHR('PUT', '/api/beneficiary/current/frailty', 200, JSON.stringify(formObj))
		.then(function(res) {
			new Modal('saveSuccess', function() {
				modified = false;
				window.location.href = '/current/frailty';
			});
		}, function(error) {
			new Modal('errorOccured');
			console.log(error);
		});
}

function showConfirm() {
	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}