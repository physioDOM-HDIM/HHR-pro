'use strict';
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
    console.log("url: ", listPagerElt.url);
    listPagerElt.go();
}

function getParams() {
    var filterForm = document.forms.filter,
        orderForm = document.forms.order,
        objFilter = form2js(filterForm),
        objOrder = form2js(orderForm),
        params = "";
    console.log(objFilter);
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
    console.log(endDateContainer);
    var params = getParams();
    paginate(false, params);
}

function validFilter() {
    var params = getParams();
    paginate(true, params);
}

function init() {
    // need to set the locale for moment ( read from cookie lang or default get the language from navigator )
    var listPager = document.querySelector('tsante-list');
    listPager.addEventListener('tsante-response', function(data) {
        var list = data.detail.list;
        var i = 0,
            len = list.items.length;
        for (i; i < len; i++) {
            // the date is displayed in local time
            list.items[i].date = moment(list.items[i].datetime).format("L LT") + " ("+moment(list.items[i].datetime).from(moment())+")" ;
        }
        this.render(list);
    });
}
window.addEventListener("polymer-ready", init, false);

