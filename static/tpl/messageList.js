"use strict";

var Utils = new Utils(),
	infos = {};

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
    var filterForm = document.querySelector('form[name=filter]'),
        orderForm = document.querySelector('form[name=order]'),
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

function init() {
    var listPager = document.querySelector('tsante-list');
    listPager.addEventListener('tsante-response', function(data) {
        var list = data.detail.list;
        var i = 0,
            len = list.items.length;
        for (i; i < len; i++) {
            // the date is displayed in local time
            list.items[i].from = " ("+ moment(list.items[i].datetime).from(moment()) +")" ;
            list.items[i].datetime = moment(list.items[i].datetime).format("L LT");
        }
        this.render(list);
    });
}
window.addEventListener("polymer-ready", init, false);

window.addEventListener("DOMContentLoaded", function() {
	infos.lang = Cookies.get("lang");
	moment.locale( infos.lang==="en"?"en_gb":infos.lang );
}, false );

var showDetail = function(elt) {
	var message = elt.parentNode.parentNode,
		messageDetail = message.querySelector('.message-detail'),
		detailShow = elt.querySelector('.detail-show'),
		detailHide = elt.querySelector('.detail-hide');

	//toggle elements
	Utils.showHideElt(messageDetail, 'row message-detail');
	Utils.showHideElt(detailShow, 'detail-show');
	Utils.showHideElt(detailHide, 'detail-hide');
};