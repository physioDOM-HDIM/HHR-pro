'use strict';

var Utils = new Utils(),
	modified = false,
	datas = {};

window.addEventListener('DOMContentLoaded', function() {
	document.addEventListener('change', function (evt) {
		modified = true;
	}, true);

	datas.savedData = form2js(document.getElementById('form'));

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

function checkForm(validate) {
	var formObj = form2js(document.getElementById('form'));

	if(formObj.stepsNumber && (datas.savedData.stepsNumber !== formObj.stepsNumber)) {
		var todayDate = moment().format('L'),
		dateContainer = document.querySelector('.stepsNumberDate');
		dateContainer.innerHTML = todayDate;

		formObj['stepsNumberDate'] = todayDate;
	}

	if (formObj.stepsNumber) {
		formObj.stepsNumber = parseInt(formObj.stepsNumber, 10);
	}

	formObj.validated = validate;

	promiseXHR('PUT', '../api/beneficiary/current/activity', 200, JSON.stringify(formObj))
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
	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}