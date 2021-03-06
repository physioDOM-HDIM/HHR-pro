'use strict';
/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

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

function updateChildren(elt, idx) {
	var itemGroup = elt.parentNode.parentNode.parentNode,
		value = parseInt(elt.value),
		role = elt.parentNode.getAttribute('data-role'),
		dataRoleList = itemGroup.querySelectorAll('.roles');

	var checkRadio = function(dataRoleItem) {
		if(dataRoleItem.getAttribute('data-role') === role && role !== 'NONE') {
			var radioInput = dataRoleItem.querySelector('input[type="radio"]');

			if(parseInt(radioInput.value) === value) {
				radioInput.checked = true;
			}
		}
	}

	var getCheckedValue = function(dataRoleListParent) {
		var initValue;

		for(var y = 0; y < dataRoleListParent.length; y++) {
			if(dataRoleListParent[y].getAttribute('data-role') === role && role !== 'NONE') {
				var inputRadio = dataRoleListParent[y].querySelector('input[type="radio"]');

				if(inputRadio.checked === true) {
					initValue = parseInt(inputRadio.value);
					break;
				}
			}
		}

		return initValue;
	}

	//checking the children
	for(var i = 0; i < dataRoleList.length; i++) {
		checkRadio(dataRoleList[i]);
	}

	//checking the parent
	if(value>0) {

		var indexContainer = parseInt(idx),
			container = null;

		//loop through parents
		for(indexContainer; indexContainer > 0; indexContainer--) {
			if(container  === null) {
				container = itemGroup.parentNode;
			}
				
			var dataRoleListParent = container.children[0].querySelectorAll('.roles');

			//change the parent radio input if init value is 'no access'
			for(var i = 0; i < dataRoleListParent.length; i++) {
				if(getCheckedValue(dataRoleListParent) < value) {
					checkRadio(dataRoleListParent[i]);	
				}
			}

			container = container.parentNode;
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