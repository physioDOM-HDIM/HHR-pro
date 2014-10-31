"use strict";

/* jslint browser:true */

//window.addEventListener("DOMContentLoaded", init, false);
window.addEventListener("template-bound", checkUser, false);

function toggleHiddenNode(node, searchPattern){
	var found = false,
		searchNode;
	while(!found && node){
		searchNode = node.querySelector(searchPattern);
		if(searchNode){
			found = true;
			searchNode.setAttribute("data-state", searchNode.getAttribute("data-state") === "hidden" ? "displayed" : "hidden");
		}
		else{
			node = node.parentNode;
		}
	}
}

function toggleFilter(node){
	toggleHiddenNode(node, ".contentFilter");
	node.className = node.className.indexOf("opened") !== -1 ? node.className.replace("opened", "") : node.className + " opened";
}

function checkUser(e){
	//TODO get the info about access user
	var isAdmin = true;
	if(isAdmin){
		var editButtons = document.querySelectorAll(".editButton"),
			addEntry = document.querySelector("#addEntry");
		if(editButtons && editButtons.length > 0){
			[].map.call(editButtons, function(node){
				node.className = node.className.replace("hidden", "");
			});
		}
		if(addEntry){
			addEntry.className = addEntry.className.replace("hidden", "");
		}
	}
}

function resetFilter(){
	filter.active.checked = false;
	filter.sort.selectedIndex = 0;
}

function validFilter(){
	//TODO
}

// function init() {
// 	//TODO internationalization
// }
