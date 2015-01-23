var Utils = new Utils(),
	parameterList = [];

/**
 * INIT
 */

window.addEventListener("DOMContentLoaded", function() {
    getParameterList();
}, false);

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

    	for(var y in parameterList) {

    		parameterList[y].firstMeasureDatetime= moment(parameterList[y].firstReport).format("YYYY-MM-DD");
    		parameterList[y].lastMeasureDatetime= moment(parameterList[y].lastReport).format("YYYY-MM-DD");
    		parameterList[y].delta = parameterList[y].lastValue - parameterList[y].firstValue;

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