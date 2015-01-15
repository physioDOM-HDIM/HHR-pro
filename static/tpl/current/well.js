'use strict';

function checkForm(validate) {
	var formObj = form2js(document.getElementById('form'));
	formObj.validated = validate;

	promiseXHR('PUT', '../api/beneficiary/current/well', 200, JSON.stringify(formObj))
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