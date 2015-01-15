'use strict';

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
				document.getElementById('buttons').style.display = 'none';
			}
		}, function(error) {
			console.log(error);
		});
}

function showConfirm() {
	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}