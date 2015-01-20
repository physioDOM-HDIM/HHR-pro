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

				var textareas = document.querySelectorAll('textarea');
				for (i = 0; i < textareas.length; ++i) {
					textareas[i].setAttribute('disabled', true);
				}
			}
			new Modal('saveSuccess');
		}, function(error) {
			new Modal('errorOccured');
			console.log(error);
		});
}

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
}

function showConfirm() {
	document.getElementById('confirmModal').show();
}

function hideConfirm() {
	document.getElementById('confirmModal').hide();
}

document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('sizeInput').addEventListener('change', computeBMI);
	document.getElementById('weightInput').addEventListener('change', computeBMI);
});