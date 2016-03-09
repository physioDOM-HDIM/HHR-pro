"use strict";
console.log("messageToList");

var app = document.querySelector("#app");

app.filter = null;
app.filters = [];
app.lang = Cookies.get("lang");

// recupération des listes
function getList(obj) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET","/api/lists/"+obj.list);
	xhr.onload = function() {
		var result = [];
		var list = JSON.parse(xhr.responseText);
		list = list.items;
		result = list.filter( function(item) {
			if( item.active && item.ref !== 'NONE' ) {
				return true;
			}
		}).map( function(item) {
			return {ref:item.ref, label:item.label['en'] };
		});
		if(result.length) {
			app[obj.list] = result;
		} else {
			document.querySelector("core-selector [name='"+obj.name+"']").hidden = true;
		}
	}
	xhr.send();
}

[
	{ name:'diagnosis.chronic.main', list:'diagnosis'},
	{ name:'dependant',list:'generalStatus'},
	{ name:'undernitrition',list:'nutritionalStatus'},
	{ name:'perimeter',list:'perimeter'}
].map( function(listName) {
	getList(listName);
});
//getList("diagnosis");

function addFilter() {
	var value, label;
	
	switch( app.filter ) {
		case "city" :
			value = document.querySelector("core-pages .core-selected input").value;
			label = value;
			break;
		case "start":
			value = document.querySelector("core-pages .core-selected zdk-input-date").value;
			label = value;
			break;
		default:
			value = document.querySelector("core-pages .core-selected select").value;
			label = document.querySelector("core-pages .core-selected select").selectedOptions[0].innerHTML;
	}
	document.querySelector("core-selector [name='"+app.filter+"']").hidden=true;
	app.filters.push({filter:app.filter, value: value, label: label });
	app.filter = null;
	getBeneficiaries();
	/*
	when adding a new filter get the list of beneficiaries
	 */
}

function rmFilter(index) {
	document.querySelector("core-selector [name='"+app.filters[index].filter+"']").hidden=false;
	app.filters.splice(index, 1);
	
	getBeneficiaries();
	/*
	 when removing a filter get the list of beneficiaries
	 */
}

function getBeneficiaries() {
	var filter = {};
	var xhr = new XMLHttpRequest();
	xhr.open("POST","/api/beneficiaries/filter");
	xhr.onload = function() {
		var list = JSON.parse(xhr.responseText);
		app.number = list.length;
	};
	app.filters.forEach(function(item) {
		filter[item.filter] = item.value;
	});
	console.log(filter);
	//xhr.send(JSON.stringify({gender:"M", 'diagnosis.general':'PRE-FRAILTY','diagnosis.nutritional' : "UNDERN" }));
	xhr.send(JSON.stringify(filter));
}

function sendMessage() {
	getBeneficiaries();
}