"use strict";

/* jslint browser:true */

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

function resetFilter() {
	console.log("resetFilter", arguments);
    document.forms.filter.reset();
    var listPagerElt = document.querySelector("tsante-list");
    listPagerElt.url = getBaseURL(listPagerElt.url);
    listPagerElt.go();
}

function validFilter() {
	console.log("validFilter", arguments);
    var filterForm = document.forms.filter,
        listPagerElt = document.querySelector("tsante-list"),
        params = "",
        nameValue = "",
        filterObj = {};

    params += "?sort=" + dataFormat[filterForm.sortSelection.options[filterForm.sortSelection.selectedIndex].value];
    //ASC/DESC
    params += "&dir=" + dataFormat[filterForm.sortDirection.options[filterForm.sortDirection.selectedIndex].value];

    //TODO Perimeter
    //active
    var activeStatus = filterForm.active.options[filterForm.active.selectedIndex].value;
    if(activeStatus !== "activeAllData"){
    	filterObj.active = dataFormat[activeStatus];
    }
    //name
    nameValue = filterForm.querySelector("input[name=nameTxt]").value;
    if (nameValue) {
        filterObj[dataFormat.nameData] = nameValue;
    }
    if(JSON.stringify(filterObj) !== "{}"){
    	params += "&filter=" + JSON.stringify(filterObj);
    }
    listPagerElt.url = getBaseURL(listPagerElt.url) + params;

    console.log("validFilter - url: ", listPagerElt.url);

    listPagerElt.pg = 1;
    listPagerElt.go();
}

function updateDirectory(idx){
	console.log("updateDirectory", arguments);
	if(_dataObj && _dataObj.list && _dataObj.list.items){
		window.location = "/directory/update" + (typeof idx !== undefined && _dataObj.list.items[idx] ? "?itemId="+_dataObj.list.items[idx]._id : "");
	}
}

function onHaveData(data){
	_dataObj = data.detail;

    //TODO: temp before modifying tsante-list component
    var item;
    for(var i=0; i<_dataObj.list.items.length; i++){
        item = _dataObj.list.items[i];
        item.job = _dataLists.job.items[item.job] ? _dataLists.job.items[item.job][_lang] : item.job;
        item.role = _dataLists.role.items[item.role] ? _dataLists.role.items[item.role][_lang] : item.role;
    }
    // document.querySelector("#tsanteList template").model = {
    //    list: _dataObj.list
    // }
    listPagerElt.render( dataObj.list );
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
	console.log("init");

    var promises = {
        job: promiseXHR("GET", "/api/lists/job/array", 200),
        role: promiseXHR("GET", "/api/lists/role/array", 200)
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
            _dataLists.job = JSON.parse(results.job);
            _dataLists.role = JSON.parse(results.role);
        }
        catch(err){
            errorCB(err);
        }
    }).catch(function(error) {
        errorCB(error);
    });

    //TODO: get lang from cookie
    _lang = "en";

    listPagerElt = document.querySelector("tsante-list");
    if(listPagerElt){
    	listPagerElt.addEventListener("tsante-response", onHaveData, false);
    }
}

window.addEventListener("polymer-ready", init, false);
