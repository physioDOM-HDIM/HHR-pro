'use strict';

var Utils = new Utils(),
	modified = false,
	datas = {};

window.addEventListener('DOMContentLoaded', function() {
	document.addEventListener('change', function( evt ) {
		modified = true;
	}, false );

	//init lockdown
    datas.validateStatus = (document.querySelector('#validate-status').innerHTML === 'true');
    if(datas.validateStatus) {
    	Utils.lockdown();
    }
	
}, false);

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

function checkForm(validate) {
	var formObj = form2js(document.getElementById('form'));

	formObj.normal = (formObj.choice === 'normal');
	formObj.risk = (formObj.choice === 'risk');

	formObj.validated = validate;

	delete formObj.choice;

	promiseXHR('PUT', '../api/beneficiary/current/frailty', 200, JSON.stringify(formObj))
		.then(function(res) {
			new Modal('saveSuccess', function() {
				modified = false;
				window.location.href = '/current/frailty';
			});
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