'use strict';

var Utils = new Utils();

function cancel() {
	location.reload();
}

function checkForm() {
	var formObj = form2js(document.getElementById('form'));

	Utils.promiseXHR('PUT', '/api/rights', 200, JSON.stringify(formObj))
	.then(function(res) {
		document.getElementById('roleSelect').disabled = false;
		new Modal('saveSuccess');
	}, function(error) {
		new Modal('errorOccured');
		console.log(error);
	});
}

function updateChildren(elt) {
	var itemGroup = elt.parentNode.parentNode.parentNode,
		value = parseInt(elt.value),
		role = elt.parentNode.getAttribute('data-role'),
		dataRoleList = itemGroup.querySelectorAll('.roles');

	for(var i = 0; i < dataRoleList.length; i++) {
		if(dataRoleList[i].getAttribute('data-role') === role && role !== 'NONE') {
			var radioInput = dataRoleList[i].querySelector('input[type="radio"]');

			if(parseInt(radioInput.value) === value) {
				radioInput.checked = true;
			}
		}
	}

}

window.addEventListener('DOMContentLoaded', function() {

	document.getElementById('roleSelect').addEventListener('change', function(e) {
		var role = e.target.value;

		document.getElementById('roleInput').value = role;

		var items = document.querySelectorAll('.roles[data-role]');
		for (var i = 0; i < items.length; ++i) {

			if (items[i].getAttribute('data-role') === role && role !== 'NONE') {
				items[i].classList.remove('hidden');
			}
			else {
		 		items[i].classList.add('hidden');
			}
		}
	});

	var checkBoxes = document.querySelectorAll('input[type=checkbox');

	for (var i = 0; i < checkBoxes.length; i++) {
		checkBoxes[i].addEventListener('click', function() {
			document.getElementById('roleSelect').disabled = true;
		});
	}
});