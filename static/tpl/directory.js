"use strict";

/* jslint browser:true */

//Filter data format
var dataFormat = {
    nameData: "name.family",
    perimeterData: "perimeter",
    ascData: "1",
    descData: "-1"
},
isAdmin = false;

//Display/hide some information according to the user status
function checkUser(e) {
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
    var found = false,
        searchNode;
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
    var idx = url.indexOf("?");
    return url.slice(0, idx !== -1 ? idx : url.length);
}

function resetFilter() {
    var filterForm = document.forms.filter;
    filterForm.nameTxt.value = "";
    filterForm.perimeter.selectedIndex = 0;
    filterForm.active.checked = true;
    filterForm.sortSelection.selectedIndex = 0;
    filterForm.sortDirection.selectedIndex = 0;

    var listPagerElt = document.querySelector("tsante-list");
    listPagerElt.url = getBaseURL(listPagerElt.url);
    listPagerElt.go();
}

function validFilter() {
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
    filterObj.active = JSON.stringify(filterForm.active.checked);
    //name
    nameValue = filterForm.nameTxt.value;
    if (nameValue) {
        filterObj[dataFormat.nameData] = nameValue;
    }
    params += "&filter=" + JSON.stringify(filterObj);
    listPagerElt.url = getBaseURL(listPagerElt.url) + params;

    //console.log(listPagerElt.url);

    listPagerElt.pg = 1;
    listPagerElt.go();
}

function displayModal(param){
	var zdkModalElt = document.querySelector("zdk-modal"),
		model;
	//Edit mode
	if(typeof param !== "undefined"){
		//Get model from the tsant-list component
		model = document.querySelector("tsante-list template").model;
		if(model && model.list && model.list.items && param < model.list.items.length){
			// Clone the object to avoid the binding between the listPage item and the modal item in case of cancel
			zdkModalElt.querySelector("template").model = JSON.parse(JSON.stringify({item: model.list.items[param]}));
		}
	}
	else{
		//Add new entry mode
		zdkModalElt.querySelector("template").model = "";
	}
	zdkModalElt.show();
}

function init() {
    //TODO internationalization

	//TODO get the info about access user and
	//don't forget to call checkUser()
	isAdmin = true;

    var listPagerElt = document.querySelector("tsante-list");
    listPagerElt.addEventListener("tsante-draw", checkUser, false);
}

window.addEventListener("DOMContentLoaded", init, false);
