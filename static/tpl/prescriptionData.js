"use strict";

var utils = new Utils(),
	infos = {},
	lists = {},
	modified = false;

/**
 * Getting dataprog
 */

var getList = function () {
	var promises = {
		dataprog: utils.promiseXHR("GET", "/api/beneficiary/dataprog/" + ( infos.category || infos.paramList ), 200),
		parameterList: utils.promiseXHR("GET", "/api/lists/" + infos.paramList, 200),
		// thresholds: utils.promiseXHR("GET", "/api/beneficiary/thresholds", 200)
	};

	RSVP.hash(promises).then(function (results) {
		lists.dataprog = JSON.parse(results.dataprog);
		lists.parameters = JSON.parse(results.parameterList);
		if (infos.category) {
			lists.parameters.items = lists.parameters.items.filter(function (item) {
				return item.category === infos.category;
			});
		}
		// lists.thresholds = JSON.parse(results.thresholds);

		for (var i = 0, leni = lists.parameters.items.length; i < leni; i++) {
			lists.parameters.items[i].labelLang = lists.parameters.items[i].label[infos.lang] || lists.parameters.items[i].ref;
			/*
			 if(lists.thresholds[lists.parameters.items[i].ref]) {
			 lists.parameters.items[i].threshold = lists.thresholds[lists.parameters.items[i].ref];
			 }
			 */
		}
		init();
	});
};

/**
 * Data Binding / Templating
 */

var init = function () {
	var dataprogTpl = document.querySelector('#tpl-dataprog'),
		dataprogContainer = document.querySelector('.dataprog-list'),
		i = 0,
		len = lists.dataprog.length;

	for (i; i < len; i++) {

		var dataItem = lists.dataprog[i],
			param = utils.findInObject(lists.parameters.items, 'ref', dataItem.ref);
		
		dataItem.startDate = moment(dataItem.startDate).format("L");
		dataItem.endDate = moment(dataItem.endDate).format("L");
		
		if (dataItem.repeat > 1) {
			dataItem.freqRepeat = true;
		}
		//translate options of weekly and montly for the template
		if (dataItem.frequency === 'monthly') {
			dataItem.frequencyType = 'month';
			dataItem.freqMonth = true;
			dataItem.hasDetail = true;
			dataItem.hasMoreDetail = true;

			var weekNumber = Number(String(Math.abs(dataItem.when.days[0])).charAt(0));

			if (weekNumber === 1) {
				dataItem.when.weekFirst = true;
			} else if (weekNumber === 2) {
				dataItem.when.weekSecond = true;
			} else if (weekNumber === 3) {
				dataItem.when.weekThird = true;
			} else if (weekNumber === 4) {
				dataItem.when.weekFourth = true;
			}

			if (dataItem.when.days[0] > 0) {
				dataItem.when.orderBegin = true;
			} else {
				dataItem.when.orderEnd = true;
			}
		} else if (dataItem.frequency === 'weekly') {
			dataItem.frequencyType = 'week';
			dataItem.freqWeek = true;
			dataItem.hasDetail = true;
			dataItem.hasMoreDetail = false;
		} else {
			if (dataItem.repeat && dataItem.repeat !== 1) {
				dataItem.hasDetail = true;
			} else {
				dataItem.hasDetail = false;
			}
			dataItem.frequencyType = 'day';
			dataItem.freqDay = true;
			dataItem.hasMoreDetail = false;
		}

		var dataModel = {
			param: param,
			data: dataItem,
			getDay: function () {
				return function (val, render) {
					var dayNumber = Number(String(Math.abs(render(val))) % 10);
					return utils.getDayName(dayNumber);
				};
			},
		};

		var dataContainer = document.createElement("div");
		dataContainer.classList.add('data-item');
		dataContainer.innerHTML = Mustache.render(dataprogTpl.innerHTML, dataModel);

		dataprogContainer.appendChild(dataContainer);
	}
};

var updateParam = function (elt) {
	var container = elt.parentNode.parentNode,
		ref = elt.value,
		param = utils.findInObject(lists.parameters.items, 'ref', ref);
	// minContainer = container.querySelector('.min-threshold'),
	// maxContainer = container.querySelector('.max-threshold'),

	/*
	 if(param.threshold) {
	 minContainer.innerText = param.threshold.min;
	 maxContainer.innerText = param.threshold.max;
	 }
	 */
};

var showOptions = function (frequency, dataModel) {

	var optionsContainer = document.querySelector('.frequency-options'),
		dailyTpl = document.querySelector('#tpl-option-daily'),
		weeklyTpl = document.querySelector('#tpl-option-weekly'),
		monthlyTpl = document.querySelector('#tpl-option-monthly');

	if (frequency === 'weekly') {
		if (dataModel === undefined) {
			dataModel = {data: {repeat: 1}};
		}
		optionsContainer.innerHTML = Mustache.render(weeklyTpl.innerHTML, dataModel);
	} else if (frequency === 'monthly') {
		if (dataModel === undefined) {
			dataModel = {data: {repeat: 1}};
		}
		optionsContainer.innerHTML = Mustache.render(monthlyTpl.innerHTML, dataModel);
	} else if (frequency === 'daily') {
		if (dataModel === undefined) {
			dataModel = {data: {repeat: 1}};
		}
		optionsContainer.innerHTML = Mustache.render(dailyTpl.innerHTML, dataModel);
	}

};

/**
 * Modal Form
 */

function showForm(ref) {

	var formTpl = document.querySelector('#tpl-form'),
		modal = document.querySelector("#editModal"),
		formContainer = document.querySelector("#dataprog-form"),
		formDiv = document.createElement('div'),
		dataItem = {},
		param = {};

	if (ref) {
		dataItem = utils.findInObject(lists.dataprog, 'ref', ref);
		param = utils.findInObject(lists.parameters.items, 'ref', ref);
		moment.locale( infos.lang==="en"?"en_gb":infos.lang );
		if( dataItem.endDate && !dataItem.endDate.match(/^\d{4}-\d{2}-\d{2}$/g) ) {
			dataItem.endDate = moment(dataItem.endDate, moment.localeData().longDateFormat("L") ).format("YYYY-MM-DD"); 
		}
		if( dataItem.startDate && !dataItem.startDate.match(/^\d{4}-\d{2}-\d{2}$/g) ) {
			dataItem.startDate = moment(dataItem.startDate, moment.localeData().longDateFormat("L") ).format("YYYY-MM-DD");
		}
		dataItem.i18n = infos.lang==="en"?"en_gb":infos.lang;
	}

	var dataModel = {
		paramList: lists.parameters.items,
		param: param,
		data: dataItem,
		selection: function () {
			return function (val, render) {
				if (ref === render(val)) {
					return 'selected';
				}
			};
		},
		getFrequencyDefault: function () {
			return function (val, render) {
				if (dataItem.frequency === render(val)) {
					return 'checked';
				}
			};
		},
		getDaysDefault: function () {
			return function (val, render) {
				console.log(dataItem.when);
				var tmp = [];
				if (dataItem.frequency === "monthly") {
					for (var i = 0, l = dataItem.when.days.length; i < l; i++) {
						tmp.push(Math.abs(dataItem.when.days[i] % 10));
					}
				} else {
					if (!dataItem.when) {
						dataItem.when = {days: []};
					}
					tmp = dataItem.when.days;
				}
				if (tmp.indexOf(parseInt(render(val))) > -1) {
					return 'checked';
				}
			};
		},
		getWeekDefault: function () {
			return function (val, render) {
				if (Math.abs(parseInt(dataItem.when.days[0] / 10)) === parseInt(render(val), 10)) {
					return 'selected';
				}
			};
		},
		getStartDefault: function () {
			return function (val, render) {
				if (parseInt(render(val), 10) * dataItem.when.days[0] > 0) {
					return 'selected';
				}
			};
		}
	};


	formDiv.classList.add('modalContainer');
	formDiv.innerHTML = Mustache.render(formTpl.innerHTML, dataModel);

	formContainer.appendChild(formDiv);


	//Set threshold for first param of the list
	var select = formContainer.querySelector('#ref-select');
	updateParam(select);
	//show default frequency option template
	showOptions(dataItem.frequency, dataModel);

	modal.show();
}

function closeForm() {
	var modal = document.querySelector("#editModal"),
		formContainer = document.querySelector("#dataprog-form");

	formContainer.innerHTML = '';

	modal.hide();
}

/**
 * Action on form
 */

var saveData = function () {
	modified = true;
	var data = form2js( document.querySelector("form[name=dataprog]") ),
		param = utils.findInObject(lists.parameters.items, 'ref', data.ref),
		dataprog = {};

	dataprog.ref = data.ref;
	dataprog.category = infos.category || infos.paramList;
	dataprog.startDate = data.startDate;
	dataprog.endDate = data.endDate;
	dataprog.frequency = data.frequency;

	document.forms.dataprog.querySelector("#dateError").classList.add("hidden");
	if (dataprog.endDate && dataprog.startDate && dataprog.startDate > dataprog.endDate) {
		document.forms.dataprog.querySelector("#dateError").classList.remove("hidden");
		return;
	}
	if (data.repeat) {
		dataprog.repeat = parseInt(data.repeat, 10);
	}

	var inputStartDate = document.querySelector("form[name=dataprog]").querySelector("zdk-input-date[name=startDate]"),
		frequencyChoice = document.forms.dataprog.querySelector(".frequency-choice"),
		daysSelection = document.forms.dataprog.querySelector(".days");

	if (!data.startDate) {
		utils.addClass(inputStartDate, 'invalid-form');
		return;
	} else {
		utils.removeClass(inputStartDate, 'invalid-form');
	}

	if (!data.frequency) {
		utils.addClass(frequencyChoice, 'invalid-form');
		return;
	} else {
		utils.removeClass(frequencyChoice, 'invalid-form');
	}

	if (data.frequency !== "daily" && (!data.when || (data.when && !data.when.days))) {
		utils.addClass(daysSelection, 'invalid-form');
		return;
	} else if (data.frequency !== "daily") {
		utils.removeClass(daysSelection, 'invalid-form');
	}


	if (data.when) {
		var i = 0,
			len = data.when.days.length;

		dataprog.when = {};
		dataprog.when.days = [];

		if (len === 0) {
			document.forms.dataprog.querySelector(".days").style.border = "2px solid red";
			return;
		}
		for (i; i < len; i++) {
			dataprog.when.days[i] = parseInt(data.when.days[i], 10);
			if (data.when.week) {
				dataprog.when.days[i] = parseInt(data.when.order, 10) * ( parseInt(data.when.week, 10) * 10 + parseInt(data.when.days[i], 10) );
			}
		}
	}

	utils.promiseXHR('POST', '/api/beneficiary/dataprog', 200, JSON.stringify(dataprog)).then(function () {
		window.location.href = "/prescription/" + ( infos.category || infos.paramList ).toLowerCase();
		/*
		 new Modal('createSuccess', function() {
		 window.location.href = "/prescription/"+ ( infos.category || infos.paramList ).toLowerCase();
		 });
		 */
	}, function (error) {
		new Modal('errorOccured');
		console.log("saveData - error: ", error);
	});
};


var removeData = function (id) {
	modified = true;
	var deleteAction = function () {
		utils.promiseXHR("DELETE", "/api/beneficiary/dataprog/" + id, 200).then(function () {
			new Modal('deleteSuccess', function () {
				window.location.href = "/prescription/" + ( infos.category || infos.paramList ).toLowerCase();
			});
		}, function (error) {
			new Modal('errorOccured');
			console.log("saveData - error: ", error);
		});
	};

	new Modal('confirmDeleteItem', deleteAction);
};

window.addEventListener("DOMContentLoaded", function () {
	infos.category = document.querySelector('.param-category').textContent;
	infos.paramList = document.querySelector('.param-list').textContent;
	infos.lang = Cookies.get("lang");
	moment.locale( infos.lang==="en"?"en_gb":infos.lang );
	getList();
}, false);

window.addEventListener("beforeunload", function(e) {
	if( modified ) {
		console.log( "send prescription agenda");
		var xhr = new XMLHttpRequest();
		if( category ) {
			xhr.open("GET", "/api/queue/measurePlan", true);
		} else {
			xhr.open("GET", "/api/queue/symptomPlan", true);
		}
		xhr.send();
	}
});