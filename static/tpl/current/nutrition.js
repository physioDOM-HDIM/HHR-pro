'use strict';

function checkForm(validate) {
	var formObj = form2js(document.getElementById('form'));

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

	formObj.validated = validate;

	promiseXHR('PUT', '../api/beneficiary/current/nutrition', 200, JSON.stringify(formObj))
		.then(function(res) {
			if (JSON.parse(res).validated) {
				document.getElementById('buttons').innerHTML = '';

				var inputs = document.querySelectorAll('input');
				for (var i = 0; i < inputs.length; ++i) {
					inputs[i].setAttribute('disabled', true);
				}
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