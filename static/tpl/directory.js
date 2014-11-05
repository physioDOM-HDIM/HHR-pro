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
isAdmin = false;

//Display/hide some information according to the user status
function checkUser(e) {
	console.log("checkUser", arguments);
    if (isAdmin) {
        var editButtons = document.querySelectorAll(".editButton"),
            addEntry = document.querySelector("#addEntry");
        if (editButtons && editButtons.length > 0) {
            [].map.call(editButtons, function(node) {
                node.className = node.className.replace("hidden", "");
            });
        }
        if (addEntry) {
            addEntry.className = addEntry.className.replace("hidden", "");
        }
    }
}

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
            searchNode.setAttribute("data-state", searchNode.getAttribute("data-state") === "hidden" ? "displayed" : "hidden");
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
    var filterForm = document.forms.filter;
    document.querySelector("tsante-inputtext[name=nameTxt]").value = ""; //filterForm.querySelector("tsante-inputtext[name=nameTxt]").value; ==> doesn't work on FF
    filterForm.perimeter.selectedIndex = 0;
    filterForm.active.selectedIndex = 0;
    filterForm.sortSelection.selectedIndex = 0;
    filterForm.sortDirection.selectedIndex = 0;

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
    nameValue = document.querySelector("tsante-inputtext[name=nameTxt]").value; //filterForm.querySelector("tsante-inputtext[name=nameTxt]").value; ==> doesn't work on FF
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

function updateDirectory(id){
	console.log("updateDirectory", arguments);
	window.location = "updateDirectory.htm" + (id ? "?itemId="+id : "");
}

function init() {
	console.log("init");
    //TODO internationalization

	//TODO get the info about access user and
	//don't forget to call checkUser()
	isAdmin = true;

    var listPagerElt = document.querySelector("tsante-list");
    if(listPagerElt){
    	listPagerElt.addEventListener("tsante-draw", checkUser, false);
    }
}

window.addEventListener("DOMContentLoaded", init, false);
