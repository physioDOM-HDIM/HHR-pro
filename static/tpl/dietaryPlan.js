var Utils = new Utils();

/**
 * Init Data and listeners
 */

window.addEventListener('DOMContentLoaded', function() {
	initData();
}, false);

var initData = function(callback) {

	Utils.promiseXHR("GET", "/api/beneficiary/dietary-plan", 200).then(function(dietaryPlan) {
		dietaryPlan = JSON.parse(dietaryPlan);
		return {special: dietaryPlan.special, content: dietaryPlan.content, contentLined: dietaryPlan.content.replace(/(\r\n|\n|\r)/gm, "<br>")};
    }, function() {
        return {special: false, content: '', contentLined: ''};
    }).then(function(model) {
    	var container = document.querySelector('#recommendation'),
			dataTpl = document.querySelector('#dataTpl');

    	container.innerHTML = Mustache.render(dataTpl.innerHTML, model);

		var contentField = document.querySelector('#content');

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