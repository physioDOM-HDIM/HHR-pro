"use strict";

/* jslint browser:true */

/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

//Filter data format
var dataFormat = {
    nameData: "name.family",
    perimeterData: "perimeter",
    ascData: "1",
    descData: "-1",
    activeTrueData: "true",
    activeFalseData: "false"
},
listPagerElt,
_dataObj,
_dataLists,
_lang;

var promiseXHR = function(method, url, statusOK, data) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        var client = new XMLHttpRequest();
        statusOK = statusOK ? statusOK : 200;
        client.open(method, url);
        client.onreadystatechange = function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === statusOK) {
                    resolve(this.response);
                } else {
                    reject(this);
                }
            }
        };
        client.send(data ? data : null);
    });

    return promise;
};


//Toggle display/hide a node
function toggleHiddenNode(node, searchPattern) {
    console.log("toggleHiddenNode", arguments);
    var found = false,
        searchNode;
    node = node.parentNode;
    while (!found && node) {
        searchNode = node.querySelector(searchPattern);
        if (searchNode) {
            found = true;
            if(searchNode.className.indexOf("hidden") !== -1){
            	searchNode.className = searchNode.className.replace("hidden", "");
            }
            else{
            	searchNode.className += " hidden";
            }
        } else {
            node = node.parentNode;
        }
    }
}

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
	if( objFilter.active === "all" ) {
		delete objFilter.active;
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

function resetOrder() {
	document.forms.order.reset();
	var params = getParams();
	paginate(false, params);
}

function resetFilter() {
	document.forms.filter.reset();
	var params = getParams();
	paginate(false, params);
}

function validFilter() {
	var params = getParams();
	paginate(true, params);
}

function updateDirectory(idx){
	console.log("updateDirectory", arguments);
	if(_dataObj && _dataObj.list && _dataObj.list.items){
		window.location = "/directory/update" + (typeof idx !== undefined && _dataObj.list.items[idx] ? "?itemId="+_dataObj.list.items[idx]._id : "");
	}
}

function onHaveData(data){
	_dataObj = data.detail;
    
    var item;
    for(var i=0; i<_dataObj.list.items.length; i++){
        item = _dataObj.list.items[i];
        if( item.job ) {
            item.job = _dataLists.job[item.job] ? _dataLists.job[item.job][_lang] : item.job;
        }
        if( item.role ) {
            item.role = _dataLists.role[item.role] ? _dataLists.role[item.role][_lang] : item.role;
        }
        if( item.perimeter ) {
            item.perimeter = _dataLists.perimeter[item.perimeter] ? _dataLists.perimeter[item.perimeter][_lang] : item.perimeter;
        }
		if( item.organizationType ) {
			item.organizationType = _dataLists.organizationType[item.organizationType] ? _dataLists.organizationType[item.organizationType][_lang] || item.organizationType  : item.organizationType;
		}
		if( item.gender ) {
			item.gender = _dataLists.civility[item.gender] ? _dataLists.civility[item.gender][_lang] || item.gender  : item.gender;
		}
    }
    listPagerElt.render( _dataObj.list );
}

function closeModal() {
    console.log("closeModal", arguments);
    document.querySelector("#statusModal").hide();

    var elt = document.querySelector("#statusModal"),
        subElt, child;
    subElt = elt.querySelector(".modalTitleContainer");
    subElt.innerHTML = "";
    subElt.classList.add("hidden");
    subElt = elt.querySelector(".modalContentContainer");
    subElt.innerHTML = "";
    subElt.classList.add("hidden");
    subElt = elt.querySelector(".modalButtonContainer");
    for (var i = subElt.childNodes.length - 1; i >= 0; i--) {
        child = subElt.childNodes[i];
        subElt.removeChild(child);
    }
    subElt.classList.add("hidden");
}

function showModal(modalObj) {
    console.log("showModal", arguments);
    closeModal();
    var elt = document.querySelector("#statusModal"),
        subElt;
    if (modalObj.title) {
        subElt = elt.querySelector(".modalTitleContainer");
        subElt.innerHTML = document.querySelector("#" + modalObj.title).innerHTML;
        subElt.classList.remove("hidden");
    }
    if (modalObj.content) {
        subElt = elt.querySelector(".modalContentContainer");
        subElt.innerHTML = document.querySelector("#" + modalObj.content).innerHTML;
        subElt.classList.remove("hidden");
    }

    if (modalObj.buttons) {
        var btn, obj, color;
        subElt = elt.querySelector(".modalButtonContainer");
        for (var i = 0; i < modalObj.buttons.length; i++) {
            obj = modalObj.buttons[i];
            btn = document.createElement("button");
            btn.innerHTML = document.querySelector("#" + obj.id).innerHTML;
            btn.onclick = obj.action;
            switch (obj.id) {
                case "trad_ok":
                    {
                        color = "green";
                    }
                    break;
                case "trad_yes":
                    {
                        color = "green";
                    }
                    break;
                case "trad_no":
                    {
                        color = "blue";
                    }
                    break;
            }
            btn.classList.add(color);
            subElt.appendChild(btn);
        }
        subElt.classList.remove("hidden");
    }

    document.querySelector("#statusModal").show();
}

function init() {
    var promises = {
        job: promiseXHR("GET", "/api/lists/job/array", 200),
        role: promiseXHR("GET", "/api/lists/role/array", 200),
        perimeter: promiseXHR("GET", "/api/lists/perimeter/array", 200),
		organizationType: promiseXHR("GET", "/api/lists/organizationType/array", 200),
		civility: promiseXHR("GET", "/api/lists/civility/array", 200)
    };
    var errorCB = function(error){
        console.log("Init error", error);
        var modalObj = {
            title: "trad_error",
            content: "trad_error_occured",
            buttons: [{
                id: "trad_ok",
                action: function() {
                    closeModal();
                }
            }]
        };
        showModal(modalObj);
    }

    RSVP.hash(promises).then(function(results) {
        try{
            _dataLists = {};
            _dataLists.job = JSON.parse(results.job).items;
            _dataLists.role = JSON.parse(results.role).items;
            _dataLists.perimeter = JSON.parse(results.perimeter).items;
			_dataLists.organizationType = JSON.parse(results.organizationType).items;
			_dataLists.civility = JSON.parse(results.civility).items;
            
            //TODO: get lang from cookie
            _lang = Cookies.get("lang") || "en";

            listPagerElt = document.querySelector("tsante-list");
            if(listPagerElt){
                listPagerElt.addEventListener("tsante-response", onHaveData, false);
            }
            listPagerElt.go();
        }
        catch(err){
            errorCB(err);
        }
    }).catch(function(error) {
        errorCB(error);
    });

    
}

window.addEventListener("polymer-ready", init, false);
