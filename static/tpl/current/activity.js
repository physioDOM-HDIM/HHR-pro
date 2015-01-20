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
				document.getElementById('buttons').innerHTML = '';

				var inputs = document.querySelectorAll('input');
				for (var i = 0; i < inputs.length; ++i) {
					inputs[i].setAttribute('disabled', true);
				}
			}
			new Modal('saveSuccess');
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