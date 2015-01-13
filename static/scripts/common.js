"use strict";

/*
function setFixedTable(table) {
	if(!table) { return console.error("setFixedTable : no element given");}
	var table = (typeof table === 'string')?document.querySelector(table):table;
	var panel = table.parentNode;

	var fTable = table.cloneNode(true);
	fTable.removeChild(fTable.querySelector("tbody"));
	table.removeChild(table.querySelector("thead"));
	var header = document.createElement("div");
	header.classList.add("header");
	header.appendChild(fTable);
	var content = document.createElement("div");
	content.classList.add("content");
	content.appendChild(table);
	panel.appendChild(header);
	content.style.top = header.offsetHeight+"px";
	panel.appendChild(content);
	var ScrollbarWidth = getScrollbarWidth();

	fTable.style.width = (panel.offsetWidth - getScrollbarWidth()) + "px";

	window.addEventListener("resize",function() {
		fTable.style.width = (panel.offsetWidth - getScrollbarWidth()) + "px";
	},false);
};

function getScrollbarWidth() {
	var outer = document.createElement("div");
	outer.style.visibility = "hidden";
	outer.style.width = "100px";
	outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

	document.body.appendChild(outer);

	var widthNoScroll = outer.offsetWidth;
	// force scrollbars
	outer.style.overflow = "scroll";

	// add innerdiv
	var inner = document.createElement("div");
	inner.style.width = "100%";
	outer.appendChild(inner);

	var widthWithScroll = inner.offsetWidth;

	// remove divs
	outer.parentNode.removeChild(outer);

	return widthNoScroll - widthWithScroll;
}
*/

window.addEventListener("DOMContentLoaded", initFrame, false);

function initFrame() {
	if(!parent) return;
	
	if(parent.setTitle) {
		parent.setTitle();
	}
}

/**
 * Render a template in a DOM element.
 * 
 * @param  {string} elementId  ID of the element
 * @param  {string} templateId ID of the Mustache template
 * @param  {object} data       Data object
 */
function renderTemplate(elementId, templateId, data) {
	if (Mustache) {
		var templ = document.getElementById(templateId).innerHTML;
		Mustache.parse(templ);
		var rendered = Mustache.render(templ, data);
		document.getElementById(elementId).innerHTML = rendered;
	}
}

function promiseXHR(method, url, statusOK, data) {
	var promise = new RSVP.Promise(function(resolve, reject) {
		var client = new XMLHttpRequest();
		statusOK = statusOK ? statusOK : 200;
		client.open(method, url);
		client.onreadystatechange = function handler() {
			if (this.readyState === this.DONE) {
				if (this.status === statusOK) {
					resolve(this.response);
				}
				else {
					reject(this);
				}
			}
		};
		client.send(data ? data : null);
	});

	return promise;
}