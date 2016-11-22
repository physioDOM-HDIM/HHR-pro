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

var Utils = new Utils(),
	parameterList = [],
    lang = "en";


var getParameterList = function() {
   	Utils.promiseXHR("GET", "/api/beneficiary/graph", 200).then(function(results) {
		var parameters = JSON.parse(results),
			container = document.querySelector('#synthesis'),
			tplLine = document.querySelector('#tpl-line');

		for(var param in parameters) {
			var i = 0,
				len = parameters[param].length;

			for(i; i<len; i++) {
				parameterList.push(parameters[param][i]);
			}
		}
		moment.locale(Cookies.get("lang")=="en"?"en-gb":Cookies.get("lang"));;
		
    	for(var y in parameterList) {

    		parameterList[y].firstMeasureDatetime= moment(parameterList[y].firstReport).format("L");
    		parameterList[y].lastMeasureDatetime= moment(parameterList[y].lastReport).format("L");
    		parameterList[y].delta = (parameterList[y].lastValue - parameterList[y].firstValue).toFixed(2);

			var row = document.createElement('div'),
				model = {
					parameter: parameterList[y]
				};

			row.className = 'row line-parameter';
			row.innerHTML = Mustache.render(tplLine.innerHTML, model);

			container.appendChild(row);
    	}

   	});
};

/**
 * INIT
 */

window.addEventListener("DOMContentLoaded", function() {
	lang = Cookies.get("lang");
	getParameterList();
}, false);