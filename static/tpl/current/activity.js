'use strict';

var Utils = new Utils(),
	modified = false,
	datas = {},
	infos = {},
	lists= {};

window.addEventListener('DOMContentLoaded', function() {
	moment.locale(Cookies.get("lang")=="en"?"en-gb":Cookies.get("lang"));
	infos.lang = Cookies.get("lang");
	document.addEventListener('change', function (evt) {
		modified = true;
	}, true);

	datas.savedData = form2js(document.getElementById('form'));

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

    datas.btnList = document.querySelectorAll('.to-valid');
});

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
	var formElt = document.getElementById('form');

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

	if( formObj.parameters ) {
		formObj.parameters.forEach(function (parameter) {
			if (!parameter.value) {
				parameter.value = null;
				parameter.date = null;
			} else {
				parameter.value = parseInt(parameter.value, 10);
				if (!parameter.date) {
					parameter.date = moment().format("YYYY-MM-DD");
				}
			}
			if (!parameter.comment) {
				parameter.comment = "";
			}
		});
	}

	formObj.validated = validate;
	if(validate) {
		formObj.validatedDate = moment().format('YYYY-MM-DD');
	}

	promiseXHR('PUT', '/api/beneficiary/current/activity', 200, JSON.stringify(formObj))
		.then(function(res) {
			new Modal('saveSuccess', function() {
				modified = false;
				window.location.href = '/current/activity';
			});
		}, function(error) {
			new Modal('errorOccured');
			console.log(error);
		});
}

function showConfirm() {
	var formElt = document.getElementById('form');

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