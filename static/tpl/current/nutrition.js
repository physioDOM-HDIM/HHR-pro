'use strict';

function checkForm() {
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

	promiseXHR('PUT', '../api/beneficiary/current/nutrition', 200, JSON.stringify(formObj))
		.then(function(res) {
			console.log(res);
		}, function(error) {
			console.log(error);
		});
}