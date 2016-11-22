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