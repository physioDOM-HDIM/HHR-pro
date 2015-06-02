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
		thresholds: utils.promiseXHR("GET", "/api/beneficiary/thresholds", 200)
	};

	RSVP.hash(promises).then(function (results) {
		lists.dataprog = JSON.parse(results.dataprog);
		lists.parameters = JSON.parse(results.parameterList);
		if (infos.category) {
			lists.parameters.items = lists.parameters.items.filter(function (item) {
				return (item.category === infos.category);
			});
		}

		lists.parameters.items = lists.parameters.items.filter(function (item) {
				return (item.active === true);
			});

		lists.thresholds = JSON.parse(results.thresholds);

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
		
		//hide prescription with inactive params
		if(param === null) {
			continue;
		}
		
		if( lists.thresholds[dataItem.ref] && ( lists.thresholds[dataItem.ref].min || lists.thresholds[dataItem.ref].max )  ) {
			dataItem.hasThreshold = true;
			dataItem.threshold = {};
			dataItem.threshold.min = lists.thresholds[dataItem.ref].min;
			dataItem.threshold.max = lists.thresholds[dataItem.ref].max;
		} else {
			dataItem.hasThreshold = false;
		}
		dataItem.startDate = moment(dataItem.startDate).format("L");
		if(dataItem.endDate) {
			dataItem.endDate = moment(dataItem.endDate).format("L");	
		}
		
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
		param = lists.thresholds[ref],
		min = container.querySelector('.min-threshold'),
		max = container.querySelector('.max-threshold');

	 if(param && min && max) {
	 	min.value = param.min;
	 	max.value = param.max;
		min.max = max.value;
		max.min = min.value;
	 } else {
		 min.max = null;
		 max.min = null;
	 }
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

function showForm(ref, duplication) {

	if(!ref || duplication) {
		var freeParam = false;

		for(var i = 0; i < lists.parameters.items.length; i++) {
			var resultRefSearch = utils.findInObject(lists.dataprog, 'ref', lists.parameters.items[i].ref);

			if(resultRefSearch === null) {
				freeParam = true;
				break;
			}
		}

		if(!freeParam) {
			new Modal('errorNoParamAvailable')
			return;
		}
	}


	if(infos.modal !== undefined && infos.modal.isOpen('dataProgModal')) {
		return;
	}

	var formTpl = document.querySelector('#tpl-form'),
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
		hasThresholds: infos.category,
		selection: function () {
			return function (val, render) {
				if (ref === render(val) && !duplication) {
					return 'selected';
				}
			};
		},
		disable: function() {
			return function (val, render) {
				if(utils.findInObject(lists.dataprog, 'ref', render(val)) !== null) {
					return 'disabled';
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
	if( !ref || duplication) {
		formDiv.querySelector("#delBtn").classList.add("hidden");
	}
	if(infos.category) {
		if( dataModel.data.threshold && dataModel.data.threshold.max ) {
			formDiv.querySelector("[name='threshold.min']").setAttribute("max",dataModel.data.threshold.max);
		} else {
			formDiv.querySelector("[name='threshold.min']").removeAttribute("max");
		}
		if(  dataModel.data.threshold && dataModel.data.threshold.min ) {
			formDiv.querySelector("[name='threshold.max']").setAttribute("min",dataModel.data.threshold.min);
		} else {
			formDiv.querySelector("[name='threshold.max']").removeAttribute("min");
		}
	}
	formContainer.appendChild(formDiv);
	
	setTimeout( function() {
		moment.locale( infos.lang==="en"?"en_gb":infos.lang );
		[].slice.call(document.querySelectorAll("zdk-input-date")).forEach( function(item) {
			item.setAttribute("i18n", infos.lang=="en"?"en-gb":infos.lang );
		});
		
		updateCal();
		var inputStartDate = document.querySelector("zdk-input-date[name=startDate]");
		var inputEndDate = document.querySelector("zdk-input-date[name=endDate]");
		inputStartDate.onchange = updateCal;
		inputEndDate.onchange = updateCal;
	}, 100 );
	

	//Set threshold for first param of the list
	var select = formContainer.querySelector('#ref-select');
	updateParam(select);


	if(ref && !duplication) {
		select.disabled = true;
		var inputHidden = document.createElement('input');
		inputHidden.setAttribute('type', 'hidden');
		inputHidden.setAttribute('value', ref);
		inputHidden.setAttribute('name', 'ref');
		formContainer.appendChild(inputHidden);
	}

	//show default frequency option template
	showOptions(dataItem.frequency, dataModel);

	infos.modal = new Modal('dataProgModal');
}

function closeForm() {
	var formContainer = document.querySelector("#dataprog-form");

	formContainer.innerHTML = '';

	infos.modal.closeModal('dataProgModal');
}

function changeThreshold() {
	var formContainer = document.querySelector("#dataprog-form")
	var min = formContainer.querySelector("[name='threshold.min']");
	var max = formContainer.querySelector("[name='threshold.max']");
	
	if( min.value) {
		max.setAttribute("min",min.value);
	} else {
		max.removeAttribute("min");
	}
	if( max.value ) {
		min.setAttribute("max",max.value);
	} else {
		min.removeAttribute("max");
	}
}

/**
 * Action on form
 */

var saveData = function () {
	modified = true;
	var data = form2js( document.querySelector("form[name=dataprog]") ),
		param = utils.findInObject(lists.parameters.items, 'ref', data.ref),
		dataprog = {},
		thresholds = {};
	
	if( !document.querySelector("form[name=dataprog]").checkValidity() ) {
		document.querySelector("#Save").click();
		return false;
	}
	
	//preparing threshold data to save
	if( data.threshold ) {
		thresholds[data.ref] = {};
		thresholds[data.ref].min = data.threshold.min ? parseFloat(data.threshold.min) : null;
		thresholds[data.ref].max = data.threshold.max ? parseFloat(data.threshold.max) : null;
	}

	//preparing dataprescription
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
		if( thresholds[data.ref] ) {
			utils.promiseXHR("POST", "/api/beneficiary/thresholds", 200, JSON.stringify(thresholds)).then(function (response) {
				window.location.href = "/prescription/" + ( infos.category || infos.paramList ).toLowerCase();
			}, function (error) {
				new Modal('errorOccured');
				console.log("saveData - error: ", error);
			});
		} else {
			window.location.href = "/prescription/" + ( infos.category || infos.paramList ).toLowerCase();
		}
    }, function(error) {
    	new Modal('errorOccured');

    });

	return true;
};

function updateCal() {
	var inputStartDate = document.querySelector("zdk-input-date[name=startDate]");
	var inputEndDate = document.querySelector("zdk-input-date[name=endDate]");

	if( inputStartDate.value && inputEndDate ) {
		inputEndDate.start = inputStartDate.value;
	}
	if( inputEndDate.value && inputStartDate ) {
		inputStartDate.stop = inputEndDate.value;
	}
}

var removeData = function (id) {
	if( !id ) {
		window.location.href = "/prescription/" + ( infos.category || infos.paramList ).toLowerCase();
		return;
	}
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

	var zdkInputDates = document.querySelectorAll("zdk-input-date");
	[].slice.call(zdkInputDates).forEach(function (elt) {
		elt.setAttribute("i18n", Cookies.get("lang")=="en"?"en_gb":Cookies.get("lang"));
	});
	
	getList();
}, false);