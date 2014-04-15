var Calendar1, Calendar2;

(function init() {
	$("ul.dropdown-menu").on("click", "li", function (e) {
		e.stopPropagation();
	});

	Calendar1 = new dhtmlXCalendarObject("calendar1");
	Calendar1.setDateFormat("%Y-%m-%d %H:%i");
	Calendar1.setDate(document.querySelector("#calendar1").value + " 00:00");
	Calendar1.setDateFormat("%Y-%m-%d");
	Calendar2 = new dhtmlXCalendarObject("calendar2");
	Calendar2.setDateFormat("%Y-%m-%d %H:%i");
	Calendar2.setDate(document.querySelector("#calendar2").value + " 23:59");
	Calendar2.setDateFormat("%Y-%m-%d");

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
			min                 : moment(Calendar1.getDate()).valueOf(),
			max                 : moment(Calendar2.getDate()).valueOf()
		},
		yAxis    : [
			{
				title    : {
					text : "Pulse",
					style: {
						color: '#4572A7'
					}
				},
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
						value: 150 // Need to set this probably as a var.
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
				plotLines: [
					{
						value: 0,
						width: 1,
						color: 'tomato'
					},{
						color: 'tomato',
						width: 2,
						value: 30 // Need to set this probably as a var.
					},{
						color: 'tomato',
						width: 2,
						value: 150 // Need to set this probably as a var.
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

	Calendar1.hideTime();
	Calendar2.hideTime();
	Calendar1.attachEvent("onClick", function (d) {
		chart.xAxis[0].setExtremes(moment(d).valueOf(), moment(Calendar2.getDate()).valueOf(), true);
	});
	Calendar2.attachEvent("onClick", function (d) {
		chart.xAxis[0].setExtremes(moment(Calendar1.getDate()).valueOf(), moment(d).valueOf(), true);
	});
	setFixedTable("#measures");
})();

function setSens(obj, inputId, mezh) {
	var myCalendar;
	if (obj.id === "calendar1") {
		myCalendar = Calendar1;
	} else {
		myCalendar = Calendar2;
	}
	if (mezh == "min") {
		myCalendar.setSensitiveRange(document.getElementById(inputId).value, null);
	} else {
		myCalendar.setSensitiveRange(null, document.getElementById(inputId).value);
	}
}