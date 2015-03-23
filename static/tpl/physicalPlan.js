var Utils = new Utils();
var modified = false;

/**
 * Init Data and listeners
 */

window.addEventListener('DOMContentLoaded', function() {
	initData();
	document.addEventListener('keypress', function( evt ) {
		if( evt.target.tagName === "TEXTAREA") {
			modified = true;
			document.querySelector("#saveBtn").disabled = false;
		}
	}, true );
}, false);

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

var initData = function(callback) {

	Utils.promiseXHR("GET", "/api/beneficiary/physical-plan", 200).then(function(physicalPlan) {
		physicalPlan = JSON.parse(physicalPlan);
		return { content: '' || physicalPlan.content };
    }, function() {
        return {content: ''};
    }).then(function(model) {
    	var container = document.querySelector('#recommendation'),
			dataTpl = document.querySelector('#dataTpl');

    	container.innerHTML = Mustache.render(dataTpl.innerHTML, model);

		var contentField = document.querySelector('#content');

		function limitText() {
			var lines = contentField.value.split("\n");
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].length <= 60) { continue; }
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
	if( !modeUpdate[0].classList.contains("hidden") ) {
		contentField.focus();
	}

	for(y; y<leny; y++) {
		Utils.showHideElt(modeRead[y], 'mode-read');
	}

	//clear any change
	contentField.value = contentSaved.value;
};

/**
 * Actions
 */

var saveRecommendation = function() {
	var obj = form2js(document.forms.recommendation),
		recommendation = {
			content: obj.content
		};

	Utils.promiseXHR("POST", "/api/beneficiary/physical-plan", 200, JSON.stringify(recommendation)).then(function(response) {
        new Modal('saveSuccess', function() {
			modified = false;
        	window.location.href = "/physical-plan";
        });
    }, function(error) {
        new Modal('errorOccured');
    });
};