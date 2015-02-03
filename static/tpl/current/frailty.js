'use strict';

var normalElt,
	riskElt;
var modified = false;

window.addEventListener('DOMContentLoaded', function() {

	normalElt = document.querySelector('.choice-normal');
	riskElt = document.querySelector('.choice-risk');

	//default
	if(!normalElt.checked && !riskElt.checked) {
		normalElt.checked = true;
	}

	document.addEventListener('change', function( evt ) {
		modified = true;
	}, false );
	
}, false);

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

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
			modified = false;
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