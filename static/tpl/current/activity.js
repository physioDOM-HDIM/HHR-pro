'use strict';

function checkActivityForm() {
	var formObj = form2js(document.getElementById('formActivity'));

	formObj.stepsNumber = parseInt(formObj.stepsNumber, 10);
	formObj.stepsCheck = !!formObj.stepsCheck;

	promiseXHR('PUT', '../api/beneficiary/current/activity', 200, JSON.stringify(formObj))
		.then(function(res) {
			console.log(res);
		}, function(error) {	
			console.log(error);
		});
}