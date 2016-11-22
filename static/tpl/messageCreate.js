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

window.addEventListener('DOMContentLoaded', function() {
	//Limit the content length of the message
	var contentField = document.querySelector('#content');

	function limitText(evt) {
		console.log(evt);
		var lines = contentField.value.split("\n");
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].length <= 60) { continue; }
			var j = 0, space = 60;
			lines[i] = lines[i].trim();
			while (j++ <= 60) {
				if (lines[i].charAt(j) === " ") { space = j; }
			}
			lines[i + 1] = lines[i].substring(space + 1) + " " + (lines[i + 1] || "");
			lines[i] = lines[i].substring(0, space);
		}
		contentField.value = lines.slice(0, 9).join("\n");
	}

	contentField.onkeyup = limitText; //Update the count/decount of limit characters

}, false);

var sendMessage = function() {
	var obj = form2js(document.forms.message),
		message = {
			title: obj.title,
			author: obj.author,
			content: obj.content
		};

	if(!Utils.isValid(message)) {
		return;
	}

	Utils.promiseXHR("POST", "/api/beneficiary/messages", 200, JSON.stringify(message)).then(function(response) {
        new Modal('sendSuccess', function() {
        	window.location.href = "/message";
        });
    }, function(error) {
        new Modal('errorOccured');
    });
};