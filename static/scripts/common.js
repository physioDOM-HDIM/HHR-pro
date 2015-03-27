"use strict";

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