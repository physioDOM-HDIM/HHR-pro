'use strict';

function checkForm() {
	var formObj = form2js(document.getElementById('form'));

	formObj.normal = !!formObj.normal;
	formObj.risk = !!formObj.risk;

	promiseXHR('PUT', '../api/beneficiary/current/frailty', 200, JSON.stringify(formObj))
		.then(function(res) {
			console.log(res);
		}, function(error) {
			console.log(error);
		});
}