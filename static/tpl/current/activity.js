'use strict';

function checkForm() {
	var formObj = form2js(document.getElementById('form'));

	formObj.stepsNumber = parseInt(formObj.stepsNumber, 10);
	formObj.stepsCheck = !!formObj.stepsCheck;

	promiseXHR('PUT', '../api/beneficiary/current/activity', 200, JSON.stringify(formObj))
		.then(function(res) {
			console.log(res);
		}, function(error) {	
			console.log(error);
		});
}