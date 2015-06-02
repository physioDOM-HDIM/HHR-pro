"use strict";

var utils = new Utils(),
	infos = {},
	filter={},
	idx = 0,
	createdDataRecordID = null,
	lists = {},
	modified = false,
	createdNew = false,
	archiveUpdate = false,
	next = "",
	prev = "";

infos.datasInit = null;

window.addEventListener("DOMContentLoaded", function () {
	infos.datasInit = form2js(document.forms.dataRecord);
	infos.lang = Cookies.get("lang");

	if( location.search ) {
		var navs = document.querySelectorAll(".nav");
		[].slice.call(navs).forEach( function(elt) {
			elt.classList.remove("hidden");
		});
			
		var qs = location.search.slice(1).split("&");
		qs.forEach(function (item) {
			var tmp = item.split("=");
			filter[tmp[0]] = isNaN(tmp[1]) || !tmp[1].length ? tmp[1] : parseInt(tmp[1], 10);
		});
		console.log(filter);
		var url = '/api/beneficiary/datarecords?pg=1&offset=1000';
		if (filter.filter) { url += "&filter=" + filter.filter; }
		if (filter.sort) { url += "&sort=" + filter.sort; }
		if (filter.dir) { url += "&dir=" + filter.dir; }
		
		var xhrItems = new XMLHttpRequest();
		xhrItems.open("GET", url, true);
		xhrItems.onload = function (e) {
			var list = JSON.parse(this.responseText);
			if( filter.indx === 1 ) {
				[].slice.call(document.querySelectorAll("button.previous")).forEach( function(elt) {
					elt.disabled = true;
				});
				
			} else {
				prev = list.items[filter.indx-2]._id;
			}
			if( list.nb <= filter.indx ) {
				[].slice.call(document.querySelectorAll("button.next")).forEach( function(elt) {
					elt.disabled = true;
				});
			} else {
				next = list.items[filter.indx]._id;
			}
		};
		xhrItems.send();
	}
	
	moment.locale(infos.lang === "en"?"en_gb":infos.lang );
	var dateTime = document.querySelector("#datetime").innerHTML.trim();
	if( dateTime ) {
		document.querySelector("#datetime").innerHTML = moment(dateTime).format("L LT");
	} else {
		document.querySelector("#datetime").innerHTML = "";
	}
	
	getLists();

	document.addEventListener('change', function (evt) {
		modified = true;
	}, true);

	createdDataRecordID = document.querySelector("#createdDataRecordID").value;
	if(createdDataRecordID !== null && createdDataRecordID !== '') {
		archiveUpdate = true;
	}

	infos.btnSave = document.querySelector('#saveBtn');

	var isHealthStatus = (document.querySelector('.health-status').innerHTML === 'true');
	if(isHealthStatus) {
		utils.lockActions();
	}

	if(!archiveUpdate) {
		isHealthStatusValidated();
	}

}, false);

function previousItem() {
	filter.indx--;
	var tmp = "";
	for( var prop in filter ) {
		tmp += (tmp.length?"&":"")+prop+"="+filter[prop];
	}
	window.location.href = "/datarecord/"+prev+"?"+tmp;
}

function nextItem() {
	filter.indx++;
	var tmp = "";
	for( var prop in filter ) {
		tmp += (tmp.length?"&":"")+prop+"="+filter[prop];
	}
	window.location.href = "/datarecord/"+next+"?"+tmp;
}

function backDatarecord() {
	var url = "/datarecord";
	if( filter ) {
		var tmp = "";
		for( var prop in filter ) {
			tmp += (tmp.length?"&":"")+prop+"="+filter[prop];
		}
		url += "?"+tmp;
	}
	window.location.href = url;
}

function isHealthStatusValidated() {
	utils.promiseXHR("GET", "/api/beneficiary/current/validation", 200)
		.then(function (res) {
			infos.isValid = JSON.parse(res).isValid;
			if(!infos.isValid) {
				var noValidationMessage = document.querySelector('.no-validation');
				utils.lockActions();
				utils.lockdown();
				
				utils.showElt(noValidationMessage, 'no-validation alert-info-error');
			}
		});
}

window.addEventListener("beforeunload", function (e) {
	var confirmationMessage;
	if( createdNew ) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "/api/queue/history", true);
		xhr.send();
	}
	if (modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

function hasClass(element, cls) {
	return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function isValid() {
	var inputList = [].slice.call(document.querySelectorAll('input[type="number"]')),
		selectList = [].slice.call(document.querySelectorAll('select')),
		arrayValue = inputList.concat(selectList),
		valid = true;

	for(var i = 0; i< arrayValue.length; i++) {
		if(arrayValue[i].value === '') {
			valid = false;
			break;
		}

		if(i === (arrayValue.length-1)) {
			valid = true;
		}
	}

	return valid;
}

function validateChecking() {
	infos.btnSave.disabled = !isValid();
}

/* UI Actions */

function getCategoryParam(category, filterON) {
	var list = null;

	function filterActive(element) {
		if(filterON) {
			return element.active;
		} else {
			return true;
		}
	}

	switch (category) {
		case 'General':
			list = lists.parameters.filter(filterActive);
			break;
		case 'HDIM':
			list = lists.parameters.filter(filterActive);
			break;
		case 'symptom':
			list = lists.symptom.filter(filterActive);
			break;
		case 'questionnaire':
			list = lists.questionnaire.filter(filterActive);
			break;
	}

	return list;
}

function addLine(category) {
	var tpl = document.getElementById('newItem'),
		container = document.getElementById('newItems-' + category),
		newLine = document.createElement('div'),
		selectParamTpl = document.getElementById('selectParam').innerHTML;

	//add index to line for form2js formating
	var modelData = {
		idx: ++idx,
		lists: getCategoryParam(category, true),
		questionnaire: (category === 'questionnaire')
	};

	newLine.innerHTML = tpl.innerHTML;
	newLine.className = 'questionnaire-row';

	newLine.querySelector('.item-text').innerHTML = selectParamTpl;

	var html = Mustache.render(newLine.innerHTML, modelData);
	newLine.innerHTML = html;

	if (category === 'questionnaire') {
		newLine.querySelector('.questionnaire-button-container a.button').addEventListener('click', onQuestionnaireButtonClick);
	}

	var allSelectedOptions = container.parentNode.parentNode.querySelectorAll('.item-text select option:checked');
	var newLineOptions = newLine.querySelectorAll('.item-text select option');

	var i, j;
	for (i = 0; i < allSelectedOptions.length; i++) {
		for (j = 0; j < newLineOptions.length; j++) {
			if (allSelectedOptions[i].value === newLineOptions[j].value && newLineOptions[j].value !== '') {
				newLineOptions[j].disabled = true;
			}
		}
	}

	if (category === 'symptom') {
		newLine.querySelector("input[type=number]").setAttribute("min", 0);
		newLine.querySelector("input[type=number]").setAttribute("max", 10);
		newLine.querySelector("input[type=number]").setAttribute("step", 1);
	}
	container.appendChild(newLine);

	var contentField = newLine.querySelector('.questionnaire-comment');

	if (contentField) {
		contentField.onkeyup = function () {
			var lines = contentField.value.split("\n");
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].length <= 60) {
					continue;
				}
				var j = 0, space = 60;
				while (j++ <= 60) {
					if (lines[i].charAt(j) === " ") {
						space = j;
					}
				}
				lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");
				lines[i] = lines[i].substring(0, space);
			}
			contentField.value = lines.slice(0, 9).join("\n");
		};
	}


	newLine.querySelector('input[type="number"]').addEventListener('input', function() {
		validateChecking();
	}, false);

	newLine.querySelector('select').addEventListener('change', function() {
		validateChecking();
	}, false);


	validateChecking();

}

function removeLine(element) {
	var line = element.parentNode.parentNode.parentNode,
		container = line.parentNode;

	container.removeChild(line);

	// Enable the selected option on other rows

	var allSelectedOptions = container.parentNode.parentNode.querySelectorAll('.item-text select option:checked');
	var allOptions = container.parentNode.parentNode.querySelectorAll('.item-text select option');

	var i, j;
	for (i = 0; i < allOptions.length; i++) {
		allOptions[i].disabled = false;
		for (j = 0; j < allSelectedOptions.length; j++) {
			if (allOptions[i] !== allSelectedOptions[j] &&
				allSelectedOptions[j].value === allOptions[i].value &&
				allOptions[i].value !== '') {
				allOptions[i].disabled = true;
				break;
			}
		}
	}

	validateChecking();

}

function removeItem(id) {
	var item = document.getElementById('ID' + id),
		container = item.parentNode;

	container.removeChild(item);

	validateChecking();
}

/* Form Valid */
function update(dataRecordID, mode) {
	var obj = form2js(document.forms.dataRecord);

	if (JSON.stringify(obj) !== "{}") {

		var i = 0,
			data = obj.items,
			len = data.length,
			origin = infos.datasInit.items;

		for (i; i < len; i++) {
			//Bool and float convertion
			data[i].value = parseFloat(data[i].value);
			data[i].automatic = (data[i].automatic === "true");

			if(["General","HDIM"].indexOf(data[i].category) !== -1 ) {
				data[i].category = "measures";
			}
			
			if (origin && origin[i]) {
				origin[i].value = parseFloat(origin[i].value);
				origin[i].automatic = (origin[i].automatic === "true");

				//check if change has been done, if so set automatic field to false
				if (origin[i].value !== data[i].value || origin[i].text !== data[i].text) {
					data[i].automatic = false;
				}
			}
		}

		utils.promiseXHR("PUT", "/api/beneficiary/datarecords/" + dataRecordID+"?mode="+mode, 200, JSON.stringify(data))
			.then(function (response) {
				updateSuccess();
				modified = false;
				createdNew = true;
			}, function (error) {
				errorOccured();
				console.log("saveForm - error: ", error);
			});

	} else {
		new Modal('confirmDeleteRecord', function () {
			utils.promiseXHR("DELETE", "/api/beneficiary/datarecords/" + dataRecordID, 200)
				.then(function (response) {
					modified = false;
					createdNew = true;
					window.location.href = "/datarecord";
				}, function (error) {
					errorOccured();
					console.log("saveForm - error: ", error);
				});
		});
	}
}

function create(mode) {

	if (createdDataRecordID) {
		update(createdDataRecordID, mode);
	} else {
		var obj = form2js(document.forms.dataRecord),
			sourceID = document.querySelector('#sourceID');

		if (JSON.stringify(obj) !== "{}") {
			obj.source = sourceID.value;

			var i = 0,
				len = obj.items.length;

			for (i; i < len; i++) {
				//Bool and float convertion
				// if(obj.items[i].category !== "questionnaire")
				obj.items[i].value = parseFloat(obj.items[i].value);
				obj.items[i].automatic = false;
				if(["General","HDIM"].indexOf(obj.items[i].category) !== -1 ) {
					obj.items[i].category = "measures";
				}
			}
			
			utils.promiseXHR("POST", "/api/beneficiary/datarecord", 200, JSON.stringify(obj)).then(function (response) {
				createSuccess();
				var record = JSON.parse(response);
				createdDataRecordID = record._id;
				sourceID.disabled = true;
				modified = false;
				createdNew = true;
			}, function (error) {
				errorOccured();
				console.log("saveForm - error: ", error);
			});
		}
	}
}


function getLists() {

	var promises = {
		parameters: utils.promiseXHR("GET", "/api/lists/parameters", 200),
		symptom: utils.promiseXHR("GET", "/api/lists/symptom", 200),
		questionnaire: utils.promiseXHR("GET", "/api/lists/questionnaire", 200),
		units: utils.promiseXHR("GET", "/api/lists/units", 200),
		threshold: utils.promiseXHR("GET", "/api/beneficiary/thresholds", 200)
	};

	RSVP.hash(promises).then(function (results) {

		lists.threshold = JSON.parse(results.threshold);

		lists.parameters = JSON.parse(results.parameters).items;
		lists.symptom = JSON.parse(results.symptom).items;
		lists.questionnaire = JSON.parse(results.questionnaire).items;

		var unitsList = JSON.parse(results.units).items;

		var i = 0,
			leni = lists.parameters.length;

		for (i; i < leni; i++) {
			for (var ref in lists.threshold) {
				if (ref === lists.parameters[i].ref) {
					lists.parameters[i].threshold = lists.threshold[ref];
				}
			}

			var y = 0,
				leny = unitsList.length;

			for (y; y < leny; y++) {
				if (lists.parameters[i].units === unitsList[y].ref) {
					lists.parameters[i].unitsLabel = unitsList[y].label[infos.lang];
					break;
				}
			}
		}
		setLang();
		initParams();

	});

}

function setLang() {
	var i, len;

	for (i = 0, len = lists.parameters.length; i < len; i++) {
		lists.parameters[i].labelLang = lists.parameters[i].label[infos.lang] || lists.parameters[i].ref;
	}
	for (i = 0, len = lists.symptom.length; i < len; i++) {
		lists.symptom[i].labelLang = lists.symptom[i].label[infos.lang] || lists.symptom[i].ref;
	}
	for (i = 0, len = lists.questionnaire.length; i < len; i++) {
		lists.questionnaire[i].labelLang = lists.questionnaire[i].label[infos.lang] || lists.questionnaire[i].ref;
	}
}

function initParams() {
	var lines = document.querySelectorAll('.line'),
		i = 0,
		len = lines.length;

	var selectParamTpl = document.getElementById('selectParam').innerHTML;

	for (i; i < len; i++) {

		var _id = lines[i].id.substring(2),
			category = lines[i].querySelector('.category').textContent,
			categoryContainer = lines[i].querySelector('.item-category');

		var type = lines[i].querySelector('.type').textContent,
			item = utils.findInObject(getCategoryParam(category), 'ref', type),
			modelDataSelect = {
				lists: getCategoryParam(category),
				selection: function () {
					return function (val, render) {
						if (item.ref === render(val)) {
							return 'selected';
						}
					};
				},
				id: _id
			},
			modelDataLine = {item: item};

		var selectHTML = Mustache.render(selectParamTpl, modelDataSelect),
			lineHTML = Mustache.render(lines[i].innerHTML, modelDataLine);

		lines[i].innerHTML = lineHTML;

		if(category !== 'questionnaire') {
			lines[i].querySelector('.item-text').innerHTML = selectHTML;
		}

		if (categoryContainer) {
			if (item.category) {
				categoryContainer.value = item.category;
			} else {
				categoryContainer.value = category;
			}
		}
	}
}

var updateParam = function (element, directValue) {
	var container = element.parentNode.parentNode.parentNode,
		select = container.querySelector('select'),
		minContainer = container.querySelector('.min-treshold'),
		maxContainer = container.querySelector('.max-treshold'),
		unitsContainer = container.querySelector('.units'),
		categoryContainer = container.querySelector('.item-category'),
		inputNumber  = container.querySelector('input[type="number"]');

	if (!directValue) {
		if (element.value !== undefined && element.value !== '') {
			var elt = element.value;
		}
	} else {
		var elt = directValue;
		select.value = elt;
	}

	//get chosen param
	var category = container.parentNode.parentNode.querySelector('.category').textContent;
	var param = utils.findInObject(getCategoryParam(category), 'ref', elt);

	//for create
	var newItemCategory = container.querySelector('#new-item-category');
	if (newItemCategory) {
		if (param && param.category) {
			newItemCategory.value = param.category;
		}
		else {
			newItemCategory.value = category;
		}
	}
	//for update
	if (categoryContainer) {
		if (param && param.category) {
			categoryContainer.value = param.category;
		}
		else {
			categoryContainer.value = category;
		}
	}


	if (elt && category !== 'symptom' && category !== 'questionnaire') {

		minContainer.innerHTML = param.threshold.min ? param.threshold.min : '-';
		maxContainer.innerHTML = param.threshold.max ? param.threshold.max : '-';
		unitsContainer.innerHTML = param.unitsLabel ? param.unitsLabel : '';

		inputNumber.setAttribute("min", param.range.min);
		inputNumber.setAttribute("max", param.range.max);

	}
	else if (category === 'questionnaire') {
		// Questionnaire item
		container.setAttribute('data-name', select.value);
		if (select.value) {
			container.querySelector('.questionnaire-button-container a.button').setAttribute('href', '/questionnaire/' + select.value);
			container.querySelector('.questionnaire-button-container a.button').classList.remove('disabled');
		}
		else {
			container.querySelector('.questionnaire-button-container a.button').classList.add('disabled');
		}
	}
	else {
		minContainer.innerHTML = '-';
		maxContainer.innerHTML = '-';
		unitsContainer.innerHTML = '';
	}

	// Disable the selected option on other rows

	var allSelectedOptions = container.parentNode.parentNode.parentNode.querySelectorAll('.item-text select option:checked');
	var allOptions = container.parentNode.parentNode.parentNode.querySelectorAll('.item-text select option');

	var i, j;
	for (i = 0; i < allOptions.length; i++) {
		allOptions[i].disabled = false;
		for (j = 0; j < allSelectedOptions.length; j++) {
			if (allOptions[i] !== allSelectedOptions[j] &&
				allSelectedOptions[j].value === allOptions[i].value &&
				allOptions[i].value !== '') {
				allOptions[i].disabled = true;
				break;
			}
		}
	}
};

function toggleEditMode(id) {
	var line = document.getElementById('ID' + id),
		updateMode = line.querySelector('.updateMode'),
		readMode = line.querySelector('.readMode'),
		paramSelect = updateMode.querySelector('select'),
		paramValue = line.querySelector('.type').textContent,
		initValue = line.querySelector('.item-value').innerHTML,
		initComment = line.querySelector('.item-comment').innerHTML;

	//reinit values
	if(line.querySelector('input[type="text"]') !== null) {
		updateParam(paramSelect, paramValue);
		line.querySelector('input[type="number"]').value = initValue;
		line.querySelector('input[type="text"]').value = initComment;	
	} else {
		line.querySelector('textarea').value = initComment;
	}

	//toggling
	if (hasClass(updateMode, 'hidden')) {
		updateMode.className = 'updateMode';
		readMode.className = 'readMode hidden';
	} else {
		updateMode.className = 'updateMode hidden';
		readMode.className = 'readMode';
	}

	//Checking values for enable/disable the save button
	line.addEventListener('input', function() {
		 validateChecking();
	}, false);

	line.addEventListener('change', function() {
		validateChecking();
	}, false);

	validateChecking();
}

function confirmDeleteItem(id) {
	new Modal('confirmDeleteItem', function () {
		removeItem(id);
		modified = true;
	});
}

function errorOccured() {
	new Modal('errorOccured');
}

function createSuccess() {
	new Modal('createSuccess');
}

function updateSuccess() {
	if(archiveUpdate) {
		new Modal('updateSuccess', function() {
			window.location.href = '/datarecord/'+createdDataRecordID;
		});
	} else {
		new Modal('updateSuccess');	
	}
}
