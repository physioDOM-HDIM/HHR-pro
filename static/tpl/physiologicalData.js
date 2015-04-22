"use strict";

var Utils = new Utils(),
	physiologicalData = {},
	infos = {},
	graph = {},
	_dataLists = {};

physiologicalData.list = {};
physiologicalData.dataRecords = {};


/**
 * INIT
 */

window.addEventListener("polymer-ready", function() {
    infos.lang = Cookies.get("lang");
	moment().locale(infos.lang=="en"?"en-gb":infos.lang);

	var promises = {
		units: Utils.promiseXHR("GET", "/api/lists/units/array", 200),
		params: Utils.promiseXHR("GET", "/api/lists/parameters/array", 200),
		symptoms: Utils.promiseXHR("GET", "/api/lists/symptom/array", 200),
		questionnaires: Utils.promiseXHR("GET", "/api/lists/questionnaire/array", 200)
	};
	
	//Used to match the job reference to a friendly user display
	RSVP.hash(promises).then(function(results) {
		_dataLists = {};
		_dataLists.units = JSON.parse(results.units).items;
		_dataLists.params = JSON.parse(results.params).items;
		_dataLists.symptom = JSON.parse(results.symptoms).items;
		_dataLists.questionnaire = JSON.parse(results.questionnaires).items;
		getParamList();
	}).catch(function(error) {
		errorCB(error);
	});
    
}, false);

/**
 * API Communication
 */

var getParamList = function(isRendered, callback) {
    Utils.promiseXHR("GET", "/api/beneficiary/graph", 200).then(function(results) {

    	var param = JSON.parse(results);
		var parsing = function(category, showThreshold) {
			param[category].forEach(function(param) {
				param.edition = showThreshold;
				param.lastReport = moment(param.lastReport).format("L LT");
			});

			physiologicalData.list[category] = param[category];
			if(!isRendered) {
				renderLine(physiologicalData.list[category], '#param-'+category+'-container');
			}
		};

		parsing('General', true);
		parsing('HDIM', true);
		parsing('symptom', false);
		parsing('questionnaire', false);

		if(!isRendered) {
			initGraph();
		} else {
			renderGraph(physiologicalData.dataRecords);
		}
	}, function(error) {
		new Modal('errorOccured');
	});

};

var getDataRecords = function(init) {
	var dateFrom = document.querySelector('.date-from').value,
		dateTo = document.querySelector('.date-to').value,
		lineBlueList = document.querySelectorAll('.line-blue'),
		lineYellowList = document.querySelectorAll('.line-yellow'),
		i = 0,
		len = lineBlueList.length,
		BlueChoice = null,
		YellowChoice = null,
		BlueCategory = null,
		YellowCategory = null,
		dateOption = '',
		promises = {};

	document.querySelector('.date-from').stop = dateTo;
	document.querySelector('.date-to').start = dateFrom;

	//fix to have dateTo full day
	dateTo = moment(new Date(dateTo)).add(1, 'days').format("YYYY-MM-DD");
	
	//getting ref for selected params
	for(i; i<len; i++) {
		if(lineBlueList[i].checked) {
			BlueChoice = lineBlueList[i].value;
			BlueCategory = lineBlueList[i].parentNode.parentNode.querySelector('.category').innerHTML;
		}
		if(lineYellowList[i].checked) {
			YellowChoice = lineYellowList[i].value;
			YellowCategory = lineBlueList[i].parentNode.parentNode.querySelector('.category').innerHTML;
		}
	}

	//adding date option if there are any
	if(Utils.parseDate(dateFrom) && Utils.parseDate(dateTo)) {
		dateOption = '?start='+dateFrom+'&stop='+dateTo;
	}

	if(BlueChoice) {
		promises.blue = Utils.promiseXHR('GET', '/api/beneficiary/graph/'+BlueCategory+'/'+BlueChoice+dateOption, 200);
	}

	if(YellowChoice) {
        promises.yellow = Utils.promiseXHR('GET', '/api/beneficiary/graph/'+YellowCategory+'/'+YellowChoice+dateOption, 200);
    }

    //TODO when API is defined/done: update graph with received datas
    RSVP.hash(promises).then(function(dataRecords) {
    	if(dataRecords.blue) {
    		physiologicalData.dataRecords.blue = JSON.parse(dataRecords.blue);
    		physiologicalData.dataRecords.blue.category = BlueCategory;
    	} else {
    		physiologicalData.dataRecords.blue = null;
    	}

    	if(dataRecords.yellow) {
    		physiologicalData.dataRecords.yellow = JSON.parse(dataRecords.yellow);
    		physiologicalData.dataRecords.yellow.category = YellowCategory;
    	} else {
    		physiologicalData.dataRecords.yellow = null;
    	}
    }, function(res) {
    	new Modal('errorOccured',undefined, res);
    }).then(function() {
    	if(BlueChoice || YellowChoice) {
    		renderGraph(physiologicalData.dataRecords);
    	}
    });

    if(!BlueChoice && !YellowChoice) {
    	renderGraph();
    }

};

var updateThreshold = function(elt) {
	var error = false;
	var line = elt;
	while(! line.classList.contains("row")) {
		line = line.parentNode;
	}
	var datas = form2js(line);

		var i = 0,
			len = datas.length;

	line.querySelector(".input-min").classList.remove("error");
	line.querySelector(".input-max").classList.remove("error");
	
	for(var prop in datas) {
		if( datas[prop].min !== parseFloat(datas[prop].min)+"" ) {
			error = true;
			line.querySelector(".input-min").classList.add("error");
		} else {
			datas[prop].min = parseFloat(datas[prop].min);
		}
		if( datas[prop].max !== parseFloat(datas[prop].max)+"" ) {
			error = true;
			line.querySelector(".input-max").classList.add("error");
		} else {
			datas[prop].max = parseFloat(datas[prop].max);
		}
	}

	if( error ) {
		return;
	}
	
	Utils.promiseXHR("POST", "/api/beneficiary/thresholds", 200, JSON.stringify(datas)).then(function(response) {

       	setThresholdUI(line);
    	toggleMode(line);
    	getParamList(true); //Get once again Param List (with isRendered arg) to have newly thresholds added
       	new Modal('updateSuccess');

    }, function(error) {

    	resetThresholdUI(line);
    	toggleMode(line);
    	new Modal('errorOccured');

    });
};

/**
 * UI
 */

var back = function(elt) {
	var line = elt;
	while(! line.classList.contains("row")) {
		line = line.parentNode;
	}

	resetThresholdUI(line);
	toggleMode(line);
};

var edit = function(elt) {
	var line = elt;
	while(! line.classList.contains("row")) {
		line = line.parentNode;
	}
	
	toggleMode(line);
};

var setThresholdUI = function(line) {
	line.querySelector('.read-min').innerHTML = line.querySelector('.input-min').value;
	line.querySelector('.read-max').innerHTML = line.querySelector('.input-max').value;
};

var resetThresholdUI = function(line) {
	line.querySelector('.input-min').value = line.querySelector('.read-min').innerHTML;
	line.querySelector('.input-max').value = line.querySelector('.read-max').innerHTML;
};

var toggleMode = function(line) {
	var modeRead = line.querySelectorAll('.mode-read'),
		modeUpdate = line.querySelectorAll('.mode-update'),
		i = 0,
		leni = modeRead.length,
		y = 0,
		leny = modeUpdate.length;

	for(i; i<leni; i++) {
		Utils.showHideElt(modeRead[i], 'mode-read');
	}

	for(y; y<leny; y++) {
		Utils.showHideElt(modeUpdate[y], 'mode-update');
	}

};

var resetLine = function(lineColor, elt) {
	var lineList = document.querySelectorAll('.line-'+lineColor),
		i = 0,
		len = lineList.length;

	for(i; i<len; i++) {
		if(elt.value !== lineList[i].value) {
			lineList[i].checked = false;
		}
	}
};

var renderLine = function(list, containerName) {
	var paramContainer = document.querySelector(containerName),
		paramLineTpl = document.querySelector('#param-line-tpl'),
		i = 0,
		len = list.length;

	for(i; i<len; i++) {
		var row = document.createElement('div'),
			model = {
				param: list[i]
			};

		row.className = 'row';
		row.innerHTML = Mustache.render(paramLineTpl.innerHTML, model);
		paramContainer.appendChild(row);
	}

};

/**
 * Graph Configuration
 */

var initGraph = function() {

	var lineBlueList = document.querySelectorAll('.line-blue'),
		lineYellowList = document.querySelectorAll('.line-yellow'),
		start = document.querySelector('.date-from'),
		stop = document.querySelector('.date-to'),
		today = moment().format("YYYY-MM-DD"),
		monthAgo = moment().subtract(1, 'months').format("YYYY-MM-DD");

	//default values
	stop.value = today;
	stop.start = monthAgo;
	start.value = monthAgo;
	start.stop = today;
	lineBlueList[0].checked = true;
	//lineYellowList[0].checked = false;

	getDataRecords();

};

var renderGraph = function(dataRecords) {
	var user = JSON.parse(document.querySelector('#user').innerHTML),
		label = "",
		unit = "",
		datas = [],
		yAxisConf = [],
		tooltip = true,
		noDataTip = document.querySelector('.empty-graph'),
		dateFrom = moment(document.querySelector('.date-from').value).valueOf(),
		dateTo = moment(document.querySelector('.date-to').value).valueOf();
	
	Utils.hideElt(noDataTip);

	//fix to have dateTo full day
	dateTo = moment(new Date(dateTo)).add(1, 'days').valueOf();

	//blue graph config
	if(dataRecords && dataRecords.blue !== null && dataRecords.blue.data.length !== 0) {

		var blueIndex = 0;

		var thresholdBlue = Utils.findInObject(physiologicalData.list[dataRecords.blue.category], 'text', dataRecords.blue.text).threshold,
			blueColor = {
				line: '#2980b9',
				area: '#5C97BF'
			};

		label = _dataLists[ ["HDIM","General"].indexOf(dataRecords.blue.category)!==-1?"params":dataRecords.blue.category][dataRecords.blue.text];
		label = label[Cookies.get("lang")] || label["en"];
		unit = "";
		if( dataRecords.blue.unitRef ) {
			unit = _dataLists.units[dataRecords.blue.unitRef];
			unit = unit[Cookies.get("lang")] || unit["en"];
		}
		var yAxisBlue = {
			title: {
				text: label,
				style: {
					color: blueColor.line
				}
			},
			labels: {
				format: '{value} '+ unit,
				style: {
					color: blueColor.line
				}
			}
		};

		var lineBlue = {
			name: label,
			color: blueColor.line,
			yAxis: blueIndex,
			data: dataRecords.blue.data,
			tooltip: {
				valueSuffix: ' '+ unit
			},
			zIndex: 1,
            marker: {
                fillColor: 'white',
                lineWidth: 2,
                lineColor: blueColor.line
            }
		};

		if(thresholdBlue) {
			var areaBlue = {
				name: 'Threshold '+ label,
				type: 'arearange',
				color: '#5C97BF',
				yAxis: blueIndex,
				zIndex: 0,
				lineWidth: 0,
				data: [
					[dateFrom, thresholdBlue.min, thresholdBlue.max],
					[dateTo, thresholdBlue.min, thresholdBlue.max]
				]
				// dataRecords.blue.data[0][0]
				// dataRecords.blue.data[dataRecords.blue.data.length-1][0]
			};

			datas.push(areaBlue);
		}

		datas.push(lineBlue);
		yAxisConf.push(yAxisBlue);
	}

	//yellow graph config
	if(dataRecords && dataRecords.yellow !== null && dataRecords.yellow.data.length !== 0) {

		var yellowIndex = 1;

		if(dataRecords.blue === null) {
			yellowIndex = 0;
		}

		var thresholdYellow = Utils.findInObject(physiologicalData.list[dataRecords.yellow.category], 'text', dataRecords.yellow.text).threshold,
			yellowColor = {
				line: '#f39c12',
				area: '#EB974E'
			};

		label = _dataLists[ ["HDIM","General"].indexOf(dataRecords.yellow.category)!==-1?"params":dataRecords.yellow.category][dataRecords.yellow.text];
		label = label[Cookies.get("lang")] || label["en"];
		unit = "";
		if( dataRecords.yellow.unitRef ) {
			unit = _dataLists.units[dataRecords.yellow.unitRef];
			unit = unit[Cookies.get("lang")] || unit["en"];
		}
		var yAxisYellow = {
			title: {
				text: label,
				style: {
					color: yellowColor.line
				}
			},
			labels: {
				format: '{value} '+ unit,
				style: {
					color: yellowColor.line
				}
			},
			opposite: true
		};

		var lineYellow = {
			name: label,
			color: yellowColor.line,
			yAxis: yellowIndex,
			data: dataRecords.yellow.data,
			tooltip: {
				valueSuffix: ' '+ unit
			},
			zIndex: 1,
            marker: {
                fillColor: 'white',
                lineWidth: 2,
                lineColor: yellowColor.line
            }
		};

		if(thresholdYellow) {
			var areaYellow = {
				name: 'Threshold '+ label,
				type: 'arearange',
				color: yellowColor.area,
				yAxis: yellowIndex,
				zIndex: 0,
				lineWidth: 0,
				data: [
					[dateFrom, thresholdYellow.min, thresholdYellow.max],
					[dateTo, thresholdYellow.min, thresholdYellow.max]
				]
			};
			datas.push(areaYellow);
		}

		datas.push(lineYellow);
		yAxisConf.push(yAxisYellow);
	}

	if(!dataRecords) {

		var yAxis = {
			title: {
				text: ' ',
				style: {
					color: '#000000'
				}
			},
			labels: {
				format: ' ',
				style: {
					color: '#000000'
				}
			}
		};

		var infos = {
			name: ' ',
			color: 'transparent',
			yAxis: 0,
			data: [
				[moment().unix(), 0]
			],
			zIndex: 1
		};

		datas.push(infos);
		yAxisConf.push(yAxis);

		tooltip = false;
		Utils.showElt(noDataTip, 'empty-graph');
	}

	var graph = {
		chart: {
			renderTo: document.querySelector('#container')
		},
		title: {
			text: ''
		},
		subtitle: {
			text: user.name.given + ' ' + user.name.family,
		},
		xAxis: {
			type: 'datetime',
			min: dateFrom,
			max: dateTo,
			dateTimeLabelFormats: {
				month: '%e %b',
				year : '%b'
			}
		},
		yAxis: yAxisConf,
		tooltip: {
			shared: true,
			enabled: tooltip,
			crosshairs: true,
			formatter: function () {
				return moment(this.x).format("LLL") + '<br/>'+ this.points[0].series.name+ ' <b>' + this.y + ' '+this.points[0].series.tooltipOptions.valueSuffix+'</b>';
			}
		},
		credits: {
			enabled: false
		},
		legend: {
			enabled: false
		},
		exporting: {
			enabled: false
		},
		plotOptions: {
            series: {
                fillOpacity: 0.1
            }
        },
		series: datas
	};

	Highcharts.setOptions({
		lang: {
			months: moment.localeData()._months,
			weekdays: moment.localeData()._weekdays,
			shortMonths: moment.localeData()._monthsShort
		}
	});
	Highcharts.dateFormats = {  W: function (timestamp) { return moment.unix(timestamp).format("LT"); } }
	new Highcharts.Chart(graph);
};