'use strict';

var modified = false;

window.addEventListener('DOMContentLoaded', function() {
	document.addEventListener('change', function (evt) {
		modified = true;
	}, true);
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

	if (formObj.stepsNumber) {
		formObj.stepsNumber = parseInt(formObj.stepsNumber, 10);
	}

	if (formObj.stepsCheck) {
		formObj.stepsCheck = !!formObj.stepsCheck;
	}

	formObj.validated = validate;

	promiseXHR('PUT', '../api/beneficiary/current/activity', 200, JSON.stringify(formObj))
		.then(function(res) {
			if (JSON.parse(res).validated) {
				document.getElementById('buttons').innerHTML = '';

				var inputs = document.querySelectorAll('input');
				for (var i = 0; i < inputs.length; ++i) {
					inputs[i].setAttribute('disabled', true);
				}
			}
			new Modal('saveSuccess');
			modified = false;
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