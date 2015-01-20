var Utils = new Utils(),
	contentLimit = 240;

/**
 * Limit Char Count Methods
 */
var setLimitInfo = function(count) {
	var limitInfo = document.querySelector('.limitInfo');

	if(!count) {
		limitInfo.innerText = contentLimit;
	} else {
		limitInfo.innerText = contentLimit - count;
	}
};

var updateLimitInfo = function() {
	if (this.value.length <= contentLimit) {
		setLimitInfo(this.value.length);
	}
};

var limitInputCheck = function () {
	if (this.value.length >= contentLimit) {
		return false;
	}
};

var limitPasteCheck = function(e) {
	if (e.clipboardData.getData('text/plain').length + this.value.length >= contentLimit) {
		return false;
	}
	setLimitInfo(this.value.length);
};

/**
 * Init Data and listeners
 */

window.addEventListener('DOMContentLoaded', function() {
	initData();
}, false);

var initData = function(callback) {
	Utils.promiseXHR("GET", "/api/beneficiary/dietary-plan", 200).then(function(dietaryPlan) {
		dietaryPlan = JSON.parse(dietaryPlan);
		return {special: dietaryPlan.special, content: dietaryPlan.content};
    }, function() {
        return {special: false, content: ''};
    }).then(function(model) {
    	var container = document.querySelector('#recommendation'),
			dataTpl = document.querySelector('#dataTpl');

    	container.innerHTML = Mustache.render(dataTpl.innerHTML, model);

		//Limit the content length of the message
		var contentField = document.querySelector('#content');

		contentField.onkeyup = updateLimitInfo; //Update the count/decount of limit characters
		contentField.onkeypress = limitInputCheck; //Limit the characters
		contentField.onpaste = limitPasteCheck; //Limit the characters

		setLimitInfo(contentField.value.length); //Init the limit
    });
};

/**
 * UI Methods
 */

var toggleMode = function() {
	var modeUpdate = document.querySelectorAll('.mode-update'),
		modeRead = document.querySelectorAll('.mode-read'),
		contentField = document.querySelector('#content'),
		contentSaved = document.querySelector('#content-saved'),
		i = 0,
		leni = modeUpdate.length,
		y = 0,
		leny = modeRead.length;

	for(i; i<leni; i++) {
		Utils.showHideElt(modeUpdate[i], 'mode-update');
	}

	for(y; y<leny; y++) {
		Utils.showHideElt(modeRead[y], 'mode-read');
	}

	//clear any change
	contentField.value = contentSaved.innerText;
	setLimitInfo(contentField.value.length);
};

/**
 * Actions
 */

var saveRecommendation = function() {
	var obj = form2js(document.forms.recommendation),
		recommendation = {
			special: (!!obj.special && obj.special === 'on'),
			content: obj.content
		};

	Utils.promiseXHR("POST", "/api/beneficiary/dietary-plan", 200, JSON.stringify(recommendation)).then(function(response) {
        new Modal('saveSuccess', function() {
        	window.location.href = "/dietary-plan";
        });
    }, function(error) {
        new Modal('errorOccured');
    });
};