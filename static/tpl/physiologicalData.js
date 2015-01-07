"use strict";

var Utils = new Utils(),
	physiologicalData = {},
	infos = {},
	graph = {};

physiologicalData.list = {};
physiologicalData.dataRecords = {};


window.addEventListener("DOMContentLoaded", function() {
    infos.lang = document.querySelector('#lang').innerText;
    getParamList();
}, false);

/**
 * Actions
 */



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

	//getting ref for selected params
	for(i; i<len; i++) {
		if(lineBlueList[i].checked) {
			BlueChoice = lineBlueList[i].value;
			BlueCategory = lineBlueList[i].parentNode.parentNode.querySelector('.category').innerText;
		}
		if(lineYellowList[i].checked) {
			YellowChoice = lineYellowList[i].value;
			YellowCategory = lineBlueList[i].parentNode.parentNode.querySelector('.category').innerText;
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
    }, function(error) {
    	console.log(error);

    	//MOCK
    	//TODO at integration: ex: if only blue is selected, pass the physiologicalData.dataRecords.yellow to null and vice versa
    	physiologicalData.dataRecords.blue = {
			ref: 'TEMP',
			name: 'Température',
			lastReport: '2014-12-09T14:44:42.061Z',
			data: [
				[1420368924, 38],
				[1420455324, 41],
				[1420541724, 39],
				[1420636945, 37]
			],
			unit: 'C°'
		};

		physiologicalData.dataRecords.yellow = {
			ref: 'DIST',
			name: 'Distance per week',
			lastReport: '2014-12-09T14:44:42.061Z',
			data: [
				[1420368924, 500],
				[1420455324, 650],
				[1420541724, 800],
				[1420636945, 210]
			],
			unit: 'km'
		};
		//ENDMOCK

    }).then(function() {
    	renderGraph(physiologicalData.dataRecords);
    });

};

var updateThreshold = function(elt) {
	var line = elt.parentNode.parentNode.parentNode,
		datas = form2js(line);

		var i = 0,
			len = datas.length;

		for(var prop in datas) {
			datas[prop].min = parseFloat(datas[prop].min);
			datas[prop].max = parseFloat(datas[prop].max);
		}

	Utils.promiseXHR("POST", "/api/beneficiary/thresholds", 200, JSON.stringify(datas)).then(function(response) {
       	setThresholdUI(line);
    	toggleMode(line);
       	new Modal('updateSuccess');
    }, function(error) {
    	resetThresholdUI(line);
    	toggleMode(line);
    	new Modal('errorOccured');
    });
};

var back = function(elt) {
	var line = elt.parentNode.parentNode.parentNode;

	resetThresholdUI(line);
	toggleMode(line);
};

var edit = function(elt) {
	var line = elt.parentNode.parentNode.parentNode;
	toggleMode(line);
};

/**
 * UI
 */

var setThresholdUI = function(line) {
	line.querySelector('.read-min').innerText = line.querySelector('.input-min').value;
	line.querySelector('.read-max').innerText = line.querySelector('.input-max').value;
};

var resetThresholdUI = function(line) {
	line.querySelector('.input-min').value = line.querySelector('.read-min').innerText;
	line.querySelector('.input-max').value = line.querySelector('.read-max').innerText;
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


/**
 * INIT
 */

var getParamList = function() {
    Utils.promiseXHR("GET", "/api/beneficiary/graph", 200).then(function(results) {

    	var param = JSON.parse(results);
		var parsing = function(category, showThreshold) {
			param[category].forEach(function(param) {
				param.edition = showThreshold;
				param.lastReport = moment(param.lastReport).format("YYYY-MM-DD HH:mm");
			});

			physiologicalData.list[category] = param[category];
			renderLine(physiologicalData.list[category], '#param-'+category+'-container');
		};

		parsing('General', true);
		parsing('HDIM', true);
		parsing('symptom', false);
		parsing('questionnaire', false);

		initGraph();
	});

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
		lineYellowList = document.querySelectorAll('.line-yellow');

	//default values
	lineBlueList[0].checked = true;
	lineYellowList[0].checked = true;

	getDataRecords();

};

var renderGraph = function(dataRecords) {
	var user = JSON.parse(document.querySelector('#user').innerText),
		datas = [],
		yAxisConf = [];

	console.log(dataRecords);

	//blue graph config
	if(dataRecords.blue !== null) {

		var thresholdBlue = Utils.findInObject(physiologicalData.list[dataRecords.blue.category], 'text', dataRecords.blue.text).threshold,
			blueColor = {
				line: '#2980b9',
				area: '#5C97BF'
			};
console.log(thresholdBlue);
		var yAxisBlue = {
			title: {
				text: dataRecords.blue.label,
				style: {
					color: blueColor.line
				}
			},
			labels: {
				format: '{value} '+ dataRecords.blue.unit,
				style: {
					color: blueColor.line
				}
			}
		};

		var lineBlue = {
			name: dataRecords.blue.label,
			color: blueColor.line,
			yAxis: 0,
			data: dataRecords.blue.data,
			tooltip: {
				valueSuffix: ' '+dataRecords.blue.unit
			},
			zIndex: 1,
            marker: {
                fillColor: 'white',
                lineWidth: 2,
                lineColor: blueColor.line
            }
		};

		var areaBlue = {
			name: 'Threshold '+dataRecords.blue.label,
			type: 'arearange',
			color: '#5C97BF',
			yAxis: 0,
			zIndex: 0,
			lineWidth: 0,
			data: [
				[dataRecords.blue.data[0][0], thresholdBlue.min, thresholdBlue.max],
				[dataRecords.blue.data[dataRecords.blue.data.length-1][0], thresholdBlue.min, thresholdBlue.max]
			]
		};

		datas.push(lineBlue);
		datas.push(areaBlue);
		yAxisConf.push(yAxisBlue);
	}

	//yellow graph config
	if(dataRecords.yellow !== null) {
		var thresholdYellow = Utils.findInObject(physiologicalData.list[dataRecords.blue.category], 'text', dataRecords.yellow.text).threshold,
			yellowColor = {
				line: '#f39c12',
				area: '#EB974E'
			};

		var yAxisYellow = {
			title: {
				text: dataRecords.yellow.label,
				style: {
					color: yellowColor.line
				}
			},
			labels: {
				format: '{value} '+ dataRecords.yellow.unit,
				style: {
					color: yellowColor.line
				}
			},
			opposite: true
		};

		var lineYellow = {
			name: dataRecords.yellow.label,
			color: yellowColor.line,
			yAxis: 1,
			data: dataRecords.yellow.data,
			tooltip: {
				valueSuffix: ' '+dataRecords.yellow.unit
			},
			zIndex: 1,
            marker: {
                fillColor: 'white',
                lineWidth: 2,
                lineColor: yellowColor.line
            }
		};

		var areaYellow = {
			name: 'Threshold '+dataRecords.yellow.label,
			type: 'arearange',
			color: yellowColor.area,
			yAxis: 1,
			zIndex: 0,
			lineWidth: 0,
			data: [
				[dataRecords.yellow.data[0][0], thresholdYellow.min, thresholdYellow.max],
				[dataRecords.yellow.data[dataRecords.yellow.data.length-1][0], thresholdYellow.min, thresholdYellow.max]
			]
		};

		datas.push(lineYellow);
		datas.push(areaYellow);
		yAxisConf.push(yAxisYellow);
	}

	var graph = {
		chart: {
			renderTo: document.querySelector('#container')
		},
		title: {
			text: 'Physiological Data',
			x   : -20
		},
		subtitle: {
			text: user.name.given + ' ' + user.name.family,
			x: -20
		},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats: {
				month: '%e %b',
				year : '%b'
			}
		},
		yAxis: yAxisConf,
		tooltip: {
			shared: true,
			enabled: true,
			crosshairs: true
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

	new Highcharts.Chart(graph);
};