"use strict";

var nav;

function initUI() {
	nav = document.querySelector("nav");
	var navbtns = document.querySelectorAll(".navbtn");
	
	DOMNodeListToArray(navbtns).forEach(function(item) { 
		item.addEventListener("click",toggleNav,false); 
	});
}

function toggleNav() {
	nav.classList.toggle("show");
}

function DOMNodeListToArray(domNodeList) {
	var res = [];
	
	for (var i= 0, l=domNodeList.length;i<l;i++) {
		if (domNodeList.item(i).nodeType==1) {
			res.push(domNodeList.item(i));
		}
	}
	return res;
}

window.addEventListener("DOMContentLoaded",initUI,false);