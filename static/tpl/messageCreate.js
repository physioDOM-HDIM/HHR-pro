var Utils = new Utils(),
	contentLimit = 200;

window.addEventListener('DOMContentLoaded', function() {

	//Limit the content length of the message
	var contentField = document.querySelector('#content'),
		limitInfo = document.querySelector('.limitInfo'),
		setLimitInfo = function(count) {
			if(!count) {
				limitInfo.innerText = contentLimit;
			} else {
				limitInfo.innerText = contentLimit - count;
			}
		},
		updateLimitInfo = function() {
			if (this.value.length <= contentLimit) {
				setLimitInfo(this.value.length);
			}
		},
		limitInputCheck = function () {
			if (this.value.length >= contentLimit) {
				return false
			}
		},
		limitPasteCheck = function(e) {
			if (e.clipboardData.getData('text/plain').length + this.value.length >= contentLimit) {
				return false;
			}
			setLimitInfo(this.value.length);
		};

	contentField.onkeyup = updateLimitInfo; //Update the count/decount of limit characters
	contentField.onkeypress = limitInputCheck; //Limit the characters
	contentField.onpaste = limitPasteCheck; //Limit the characters
	setLimitInfo(); //Init the limit

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

	Utils.promiseXHR("POST", "/api/beneficiary/message", 200, JSON.stringify(message)).then(function(response) {
        new Modal('sendSuccess', function() {
        	window.location.href = "/message";
        });
    }, function(error) {
        new Modal('errorOccured');
    });
};