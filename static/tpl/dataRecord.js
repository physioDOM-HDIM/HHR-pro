'use strict';

/* global moment, Cookies */
var filterParam = "";

//Get the base url of the tsante-list component (without potential params)
function getBaseURL(url) {
    console.log("getBaseURL", arguments);
    var idx = url.indexOf("?");
    return url.slice(0, idx !== -1 ? idx : url.length);
}

function paginate(init, params) {
    var listPagerElt = document.querySelector("tsante-list");
    if (params) {
		filterParam = params;
        listPagerElt.url = getBaseURL(listPagerElt.url) + "?"+ params;
    } else {
		filterParam = "";
        listPagerElt.url = getBaseURL(listPagerElt.url);
    }
    if (init) {
        listPagerElt.pg = 1;
    }
    // console.log("url: ", listPagerElt.url);
    listPagerElt.go();
}

function getParams() {
    var filterForm = document.querySelector('form[name=filter]'),
        orderForm = document.querySelector('form[name=order]'),
        objFilter = form2js(filterForm),
        objOrder = form2js(orderForm),
        params = "";
    
    if (JSON.stringify(objFilter) !== "{}") {
        params += "filter=" + JSON.stringify(objFilter);
    }
    if (objOrder.sort) {
        params += (params ? "&" : "") + "sort=" + objOrder.sort;
    }
    if (objOrder.dir) {
        params += (params ? "&" : "") + "dir=" + objOrder.dir;
    }
    return params;
}

function resetOrder() {
    document.forms.order.reset();
    var params = getParams();
    paginate(false, params);
}

function resetFilter() {
    document.forms.filter.reset();
    var startDateContainer = document.querySelector('.startDate'),
        endDateContainer = document.querySelector('.endDate');
    startDateContainer.value = '';
    endDateContainer.value = '';
	endDateContainer.start = null;
	startDateContainer.stop = null;
    var params = getParams();
    paginate(false, params);
}

function validFilter() {
    var params = getParams();
    paginate(true, params);
}

function updateCal() {
	var startDateContainer = document.querySelector('.startDate'),
		endDateContainer = document.querySelector('.endDate');

	if( startDateContainer.value ) {
		endDateContainer.start = startDateContainer.value;
	}
	if( endDateContainer.value ) {
		startDateContainer.stop = endDateContainer.value;
	}
}

function viewRecord(itemID, indx) {
	var listPagerElt = document.querySelector("tsante-list");
	var url = "/datarecord/"+itemID+"?indx="+(indx+ (listPagerElt.pg - 1)*10)+"&filter="+filterParam;
	console.log( url );
	window.location.href = url;
}

function init() {
	moment.locale(Cookies.get("lang")==="en"?"en-gb":Cookies.get("lang"));
	[].slice.call(document.querySelectorAll("zdk-input-date")).forEach( function(item) {
		item.setAttribute("i18n", Cookies.get("lang")==="en"?"en-gb":Cookies.get("lang") );
	});
	
    var listPager = document.querySelector('tsante-list');
    listPager.addEventListener('tsante-response', function(data) {
        var list = data.detail.list;
        var i = 0,
            len = list.items.length;
        for (i; i < len; i++) {
            // the date is displayed in local time
            list.items[i].date = moment(list.items[i].datetime).format("L LT") ;
            list.items[i].dateFrom = " ("+moment(list.items[i].datetime).from(moment())+")";
        }
        this.render(list);
    });
}
window.addEventListener("polymer-ready", init, false);

