'use strict';

var normalElt,
	riskElt;

window.addEventListener('DOMContentLoaded', function() {

	normalElt = document.querySelector('.choice-normal'),
	riskElt = document.querySelector('.choice-risk');

	//default
	if(!normalElt.checked && !riskElt.checked) {
		normalElt.checked = true;
	}

}, false);

function updateChoice(elt) {
	if(elt === normalElt) {
		riskElt.checked = (!elt.checked);
	} else {
		normalElt.checked = (!elt.checked);
	}
}

function checkForm(validate) {
	var formObj = form2js(document.getElementById('form'));

	formObj.normal = !!formObj.normal;
	formObj.risk = !!formObj.risk;

	formObj.validated = validate;

	promiseXHR('PUT', '../api/beneficiary/current/frailty', 200, JSON.stringify(formObj))
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