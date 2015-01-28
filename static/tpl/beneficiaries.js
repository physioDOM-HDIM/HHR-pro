'use strict';

//Filter data format
var dataFormat = {
		nameData: "name.family",
		zipData: "zip",
		cityData: "city",
		perimeterData: "perimeter",
		ascData: "1",
		descData: "-1"
	};

//Get the base url of the tsante-list component (without potential params)
function getBaseURL(url) {
	console.log("getBaseURL", arguments);
	var idx = url.indexOf("?");
	return url.slice(0, idx !== -1 ? idx : url.length);
}

function paginate(init, params) {
	var listPagerElt = document.querySelector("tsante-list");

	if (params) {
		listPagerElt.url = getBaseURL(listPagerElt.url) + params;
	} else {
		listPagerElt.url = getBaseURL(listPagerElt.url);
	}
	if (init) {
		listPagerElt.pg = 1;
	}

	listPagerElt.go();
}

function getParams() {
	var filterForm = document.forms.filter,
		orderForm = document.forms.order,
		objFilter = form2js(filterForm),
		objOrder = form2js(orderForm),
		params = "";

	if( objFilter.perimeter === "NONE" ) {
		delete objFilter.perimeter;
	}
	if (JSON.stringify(objFilter) !== "{}") {
		params += "?filter=" + JSON.stringify(objFilter);
	}
	if (objOrder.sort) {
		params += (params ? "&" : "?") + "sort=" + objOrder.sort;
	}
	if (objOrder.dir) {
		params += (params ? "&" : "?") + "dir=" + objOrder.dir;
	}
	return params;
}

function resetFilter() {
	document.forms.filter.reset();
	document.querySelector('.startDate').value = '';
	document.querySelector('.stopDate').value = '';

	var params = getParams();
	paginate(false, params);
}

function resetOrder() {
	document.forms.order.reset();
	var params = getParams();
	paginate(false, params);
}

function validFilter() {
	var params = getParams();
	paginate(true, params);
}
function init() {
	moment.locale(Cookies.get("lang"));
    var listPager = document.querySelector('tsante-list');
    listPager.addEventListener('tsante-response', function(data) {
        var list = data.detail.list;
        var i = 0,
            len = list.items.length;
        for (i; i < len; i++) {
			if(list.items[i].birthdate) {
				list.items[i].birthdate = moment(list.items[i].birthdate).format("L");
			}
        	if(list.items[i].lastEvent) {
        		// the date is displayed in local time
            	list.items[i].date = moment(list.items[i].lastEvent).format("L LT") ;
            	list.items[i].dateFrom = " ("+moment(list.items[i].lastEvent).from(moment())+")";
        	}
			list.items[i].activeClass = list.items[i].active?"active":"inactive";
			list.items[i].activeItem = list.items[i].active?"active":"hidden";
        }
        this.render(list);
    });
}

window.addEventListener("polymer-ready", init, false);
