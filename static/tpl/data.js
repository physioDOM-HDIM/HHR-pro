var myCalendar;

(function init() {
	$("ul.dropdown-menu").on("click","li", function(e) {
		e.stopPropagation();
	});
	
	chart = new Highcharts.Chart({
		chart   : {
			renderTo: document.querySelector('#container'),
			type: 'spline'
		},
		title   : {
			text: 'physiological data',
			x   : -20 //center
		},
		subtitle: {
			text: 'Claire Caledonie',
			x   : -20
		},
		xAxis   : {
			type                : 'datetime',
			dateTimeLabelFormats: { // don't display the dummy year
				month: '%e %b',
				year : '%b'
			},
			max : moment().valueOf(),
			min : moment("2014-03-22","YYYY-MM-DD").valueOf()
		},
		yAxis   : [{
			title    : {
				text: "Pulse",
				style: {
					color: '#4572A7'
				}
			},
			labels: {
				format: '{value} bpm',
				style: {
					color: '#4572A7'
				}
			},
			plotLines: [
				{
					value: 0,
					width: 1,
					color: '#4572A7'
				}
			]
		},{
			title: {
				text: 'Weight',
				style: {
					color: "tomato"
				}
			},
			plotLines: [
				{
					value: 0,
					width: 1,
					color: 'tomato'
				}
			],
			labels: {
				format: '{value} kg',
				style: {
					color: "tomato"
				}
			},
			opposite: true
		}
		],
		tooltip: {
			shared: true,
			enabled   : true,
			crosshairs: true
		},
		credits: {
			enabled: false
		},
		legend : { 
			enabled: false 
		},
		exporting : {
			enabled: false
		},
		series  : [
			{
				name: 'Pulse',
				color: '#4572A7',
				yAxis: 0,
				data: [
					[1395492480000, 60],
					[1395578880000, 70],
					[1395665280000, 75]
				],
				tooltip: {
					valueSuffix: ' bpm'
				}
			},{
				name: 'Weight',
				color: 'tomato',
				yAxis: 1,
				data: [ 
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

	myCalendar = new dhtmlXCalendarObject(["calendar1", "calendar2"]);
	myCalendar.hideTime();
	setFixedTable("#measures");
})();

function setSens(inputId,mezh) {
	if(mezh=="min") {
		myCalendar.setSensitiveRange(document.getElementById(inputId).value,null);
	} else { 
		myCalendar.setSensitiveRange(null,document.getElementById(inputId).value);
	}
}