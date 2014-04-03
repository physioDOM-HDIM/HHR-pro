"use strict";

var nav;

function initUI() {
	nav = document.querySelector("nav");
	var navbtns = document.querySelectorAll(".navbtn button");
	
	DOMNodeListToArray(navbtns).forEach(function(item) { 
		item.addEventListener("click",toggleNav,false); 
	});

	document.querySelector('iframe').addEventListener("load",function () {
		var doc = this.contentDocument;
		document.querySelector('header div.title').innerHTML = doc.title;
	}, false);
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

function show(page, title) {
	var article = document.querySelector("article");
	var header = document.querySelector("header .title");
	var iframe = document.querySelector("iframe");
	
	iframe.src= "/tpl/"+page+".htm";

	var nav = document.querySelector("nav");
	if(window.innerWidth < 993 && nav.classList.contains("show")) {
		toggleNav();
	}
}

function showDlg(dlgID) {
	var bg = document.querySelector("#bg");
	bg.style.display = "block";
	var dlg = document.querySelector("#"+dlgID);
	insertAfter(dlg,bg);
	dlg.style.display = "block";
}

function hideDlg(dlgID) {
	var bg = document.querySelector("#bg");
	var dlg = document.querySelector("#"+dlgID);
	if(dlg) {
		dlg.style.display = "none";
	}
	if(bg) {
		bg.style.display = "none";
	}
}

function insertAfter(newElement,targetElement) {
	//target is what you want it to go after. Look for this elements parent.
	var parent = targetElement.parentNode;

	//if the parents lastchild is the targetElement...
	if(parent.lastchild == targetElement) {
		//add the newElement after the target element.
		parent.appendChild(newElement);
	} else {
		// else the target has siblings, insert the new element between the target and it's next sibling.
		parent.insertBefore(newElement, targetElement.nextSibling);
	}
}