//Filter data format
var dataFormat = {
		nameData: "name.family",
		zipData: "zip",
		cityData: "city",
		perimeterData: "perimeter",
		ascData: "1",
		descData: "-1"
	};

//Get the base url of the tsante-list component (without potential params)
function getBaseURL(url) {
	console.log("getBaseURL", arguments);
	var idx = url.indexOf("?");
	return url.slice(0, idx !== -1 ? idx : url.length);
}

function resetFilter() {
	console.log("resetFilter", arguments);
	document.forms.filter.reset();
	var listPagerElt = document.querySelector("tsante-list");
	listPagerElt.url = getBaseURL(listPagerElt.url);
	listPagerElt.go();
}

function validFilter() {
	console.log("validFilter", arguments);
	var filterForm = document.forms.filter,
		listPagerElt = document.querySelector("tsante-list"),
		params = "",
		nameValue = "",
		filterObj = {},
		obj = form2js(filterForm);
	
	if(JSON.stringify(obj) !== "{}"){
		params += "?filter=" + JSON.stringify(obj);
	}
	if(obj.sort) {
		params += (params?"&":"?")+"sort="+obj.sort;
	}
	if(obj.dir) {
		params += (params?"&":"?")+"dir="+obj.dir;
	}
	listPagerElt.url = getBaseURL(listPagerElt.url) + params;

	console.log("validFilter - url: ", listPagerElt.url);

	listPagerElt.pg = 1;
	listPagerElt.go();
}