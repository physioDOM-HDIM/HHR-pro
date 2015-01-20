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

    		parameterList[y].firstMeasureDatetime= moment(parameterList[y].lastReport).format("YYYY-MM-DD");//remplace lastReport by firstReport
    		parameterList[y].lastMeasureDatetime= moment(parameterList[y].lastReport).format("YYYY-MM-DD");
    		parameterList[y].firstMeasure = 5;//MOCK
    		parameterList[y].lastMeasure = 30;//MOCK
    		parameterList[y].delta = parameterList[y].lastMeasure - parameterList[y].firstMeasure;

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