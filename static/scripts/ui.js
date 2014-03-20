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
	var nav = document.querySelector("nav");
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

function changeTheme(themeName) {
	var i, a, style;
	var styles = document.querySelectorAll("link[title]");
	
	for(i=0, a= styles.length; i < a; i++) {
		style = styles.item(i);
		style.disabled = true;
		if(style.getAttribute("title") == themeName) style.disabled = false;
	}
}