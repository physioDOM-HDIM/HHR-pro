(function init() {

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
			min : moment().subtract('days', 4).valueOf()
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
	
	
})();