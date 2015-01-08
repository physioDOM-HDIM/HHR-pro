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

function getBaseURL(url) {
    var idx = url.indexOf("?");
    return url.slice(0, idx !== -1 ? idx : url.length);
}

function getParams() {
    var filterForm = document.forms.filter,
        orderForm = document.forms.order,
        objFilter = form2js(filterForm),
        objOrder = form2js(orderForm),
        params = "";

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
    document.querySelector('.startDate').value = '';
    document.querySelector('.stopDate').value = '';

    var params = getParams();
    paginate(false, params);
}

function validFilter() {
    var params = getParams();
    paginate(true, params);
}