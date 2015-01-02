"use strict";

var Utils = new Utils(),
	physiologicalData = {},
	infos = {};

physiologicalData.list = {};

window.addEventListener("DOMContentLoaded", function() {
    infos.lang = document.querySelector('#lang').innerText;
    getParamList();
}, false);

/**
 * UI
 */

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

var getDataRecords = function() {
	var dateFrom = document.querySelector('.date-from').value,
		dateTo = document.querySelector('.date-to').value,
		lineBlueList = document.querySelectorAll('.line-blue'),
		lineYellowList = document.querySelectorAll('.line-yellow'),
		i = 0,
		len = lineBlueList.length,
		BlueChoice = null,
		YellowChoice = null,
		dateOption = '',
		promises = {};

	//getting ref for selected params
	for(i; i<len; i++) {
		if(lineBlueList[i].checked) {
			BlueChoice = lineBlueList[i].value;
		}
		if(lineYellowList[i].checked) {
			YellowChoice = lineYellowList[i].value;
		}
	}

	//adding date option if there are any
	if(Utils.parseDate(dateFrom) && Utils.parseDate(dateTo)) {
		dateOption = '?start='+dateFrom+'&stop='+dateTo;
	}

	if(BlueChoice) {
		promises.blue = Utils.promiseXHR("GET", "/api/beneficiary/datarecords/"+BlueChoice+dateOption, 200);
	}

	if(YellowChoice) {
        promises.yellow = Utils.promiseXHR("GET", "/api/beneficiary/datarecords/"+YellowChoice+dateOption, 200);
    }

    //TODO when API is defined/done: update graph with received datas
    RSVP.hash(promises).then(function(dataRecords) {
    	console.log(dataRecords.blue);
    	console.log(dataRecords.yellow);
    }, function(error) {
    	console.log(error);
    });

};

/**
 * INIT
 */

var getParamList = function() {
	var promises = {
            physiological: Utils.promiseXHR("GET", "/api/lists/parameters", 200),
            symptom: Utils.promiseXHR("GET", "/api/lists/symptom", 200),
            questionnaire: Utils.promiseXHR("GET", "/api/lists/questionnaire", 200)
        };

	RSVP.hash(promises).then(function(results) {
		physiologicalData.list.physiological = JSON.parse(results.physiological);
		physiologicalData.list.symptom = JSON.parse(results.symptom);
		physiologicalData.list.questionnaire = JSON.parse(results.questionnaire);


		var physiologicalList = physiologicalData.list.physiological.items,
			i = 0,
	        leni = physiologicalList.length,
	        symptomList = physiologicalData.list.symptom.items,
	        y = 0,
	        leny = symptomList.length,
	        questionnaireList = physiologicalData.list.questionnaire.items,
	        z = 0,
	        lenz = questionnaireList.length;

	    for(i; i<leni; i++) {
	        physiologicalList[i].labelLang = physiologicalList[i].label[infos.lang];
	    }
	    for(y; y<leny; y++) {
	        symptomList[y].labelLang = symptomList[y].label[infos.lang];
	    }
	    for(z; z<lenz; z++) {
	        questionnaireList[z].labelLang = questionnaireList[z].label[infos.lang];
	    }

		renderLine(physiologicalList, '#param-physiological-container');
		renderLine(symptomList, '#param-symptom-container');
		renderLine(questionnaireList, '#param-questionnaire-container');

		renderChart();
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

//TODO: graph with real data
var renderChart = function() {
	var chart = new Highcharts.Chart({
		chart    : {
			renderTo: document.querySelector('#container'),
			type    : 'spline'
		},
		title    : {
			text: 'physiological data',
			x   : -20 //center
		},
		subtitle : {
			text: 'Claire Caledonie',
			x   : -20
		},
		xAxis    : {
			type                : 'datetime',
			dateTimeLabelFormats: { // don't display the dummy year
				month: '%e %b',
				year : '%b'
			},
			min                 : 1395442800546,
			max                 : 1395788340481
		},
		yAxis    : [
			{
				title    : {
					text : "Pulse",
					style: {
						color: '#4572A7'
					}
				},
				min: 40,
				max: 140,
				labels   : {
					format: '{value} bpm',
					style : {
						color: '#4572A7'
					}
				},
				plotLines: [
					{
						value: 0,
						width: 1,
						color: '#4572A7'
					},
					{
						color: '#4572A7',
						width: 2,
						value: 50 // Need to set this probably as a var.
					},
					,
					{
						color: '#4572A7',
						width: 2,
						value: 130 // Need to set this probably as a var.
					}
				]
			},
			{  // 2nd graph
				title    : {
					text : 'Weight',
					style: {
						color: "tomato"
					}
				},
				min: 50,
				max: 75,
				plotLines: [
					{
						value: 0,
						width: 1,
						color: 'tomato'
					},{
						color: 'tomato',
						width: 2,
						value: 60 // Need to set this probably as a var.
					},{
						color: 'tomato',
						width: 2,
						value: 75 // Need to set this probably as a var.
					}
				],
				labels   : {
					format: '{value} kg',
					style : {
						color: "tomato"
					}
				},
				opposite : true
			}
		],
		tooltip  : {
			shared    : true,
			enabled   : true,
			crosshairs: true
		},
		credits  : {
			enabled: false
		},
		legend   : {
			enabled: false
		},
		exporting: {
			enabled: false
		},
		series   : [
			{
				name   : 'Pulse',
				color  : '#4572A7',
				yAxis  : 0,
				data   : [
					[1395492480000, 60],
					[1395578880000, 70],
					[1395665280000, 75]
				],
				tooltip: {
					valueSuffix: ' bpm'
				}
			},
			{
				name   : 'Weight',
				color  : 'tomato',
				yAxis  : 1,
				data   : [
					[1395492480000, 70 ],
					[1395578880000, 68.0],
					[1395665280000, 66.5],
					[1395751680000, 66]
				],
				tooltip: {
					valueSuffix: ' kg'
				}
			}
		]
	});
};
