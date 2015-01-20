var Utils = new Utils(),
	contentLimit = 200;

window.addEventListener('DOMContentLoaded', function() {
	//Limit the content length of the message
	var contentField = document.querySelector('#content');
	var limitPasteCheck = function(e) {
			if (e.clipboardData.getData('text/plain').length + this.value.length >= contentLimit) {
				return false;
			}
		};
	function limitText() {
		var lines = contentField.value.split("\n");
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].length <= 60) continue;
			var j = 0, space = 60;
			while (j++ <= 60) {
				if (lines[i].charAt(j) === " ") { space = j; }
			}
			lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");
			lines[i] = lines[i].substring(0, space);
		}
		contentField.value = lines.slice(0, 9).join("\n");
		
	}
	contentField.onkeyup = limitText; //Update the count/decount of limit characters
	contentField.onpaste = limitPasteCheck; //Limit the characters

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