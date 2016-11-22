"use strict";
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

var nav;

function initUI() {
	nav = document.querySelector("nav");
	var navbtns = document.querySelectorAll(".navbtn button");
	
	DOMNodeListToArray(navbtns).forEach(function(item) { 
		item.addEventListener("click",toggleNav,false); 
	});

	document.querySelector('iframe').addEventListener("load",function () {
		setTitle();
	}, false);
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

function show(page, title) {
	var iframe = document.querySelector("iframe");
	
	iframe.src= page;

}

function setTitle() {
	var iframe = document.querySelector("iframe");
	var title = document.querySelector("core-toolbar .title");
	title.innerHTML = iframe.contentDocument.title;
}

function showDlg(dlgID) {
	var bg = document.querySelector("#bg");
	bg.style.display = "block";
	var dlg = document.querySelector(dlgID);
	insertAfter(dlg,bg);
	dlg.classList.toggle("show");
}

function hideDlg(dlgID) {
	var bg = document.querySelector("#bg");
	var dlg = document.querySelector("#"+dlgID);
	if(dlg) {
		dlg.classList.toggle("show");
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