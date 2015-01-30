"use strict";

var Utils = new Utils();

window.addEventListener("DOMContentLoaded", init, false);

function init() {
    document.forms.newQ.addEventListener("click", function(evt){
    	var node = evt.target,
    		cl = node.classList;

    	if(node.tagName.toLowerCase() !== "button"){
    		return;
    	}

    	else if(cl.contains("addHeaderQuestion")){
    		_addHeaderQuestion(node);
    	}
    	else if(cl.contains("addQuestion")){
    		_addQuestion(node);
    	}
		else if(cl.contains("deleteQuestion")){
    		_deleteQuestion(node);
    	}
    	else if(cl.contains("deleteChoice")){
    		_deleteChoice(node);
    	}
    	else if(cl.contains("addChoice")){
    		_addChoice(node);
    	}

    }, true);
}

var updateLabel = function(elt) {
	var container = elt.parentNode.parentNode.parentNode;
	var labelContainer = container.querySelector('.label-question');

	labelContainer.innerHTML = elt.value;
};

var showQuestion = function(elt, show) {
	var toShow, toHide,
		modeEdit = elt.parentNode.parentNode.querySelectorAll('.mode-edit'),
		modeRead = elt.parentNode.parentNode.querySelectorAll('.mode-read');

	if(show) {
		toShow = modeEdit;
		toHide = modeRead;
	} else {
		toHide = modeEdit;
		toShow = modeRead;
	}

	[].forEach.call(toHide, function(elt) {
		Utils.addClass(elt, 'hidden');
	});

	[].forEach.call(toShow, function(elt) {
		Utils.removeClass(elt, 'hidden');
	});
};

function _deleteQuestion(node){
	var hr;
	while (!node.classList.contains("nestedQuestionnaire") && !node.classList.contains("itemContainer")){
		node = node.parentNode;
	}

	node.parentNode.removeChild(node);
}

function _deleteChoice(node){
	console.log("_deleteChoice");
	while (!node.classList.contains("answer")){
		node = node.parentNode;
	}
	node.parentNode.removeChild(node);
}

function _addHeaderQuestion(node){
	console.log("_addHeaderQuestion", node.getAttribute("data-obj"));
	var obj, elt, modelData, html, div, cl;

	obj = node.getAttribute("data-obj").split(";");
	elt = document.querySelector("#tplHeaderQuestion").innerHTML;
    modelData = { name: obj[0]+"["+(""+Math.random()).split(".")[1]+"]", lang: obj[1]};
    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.innerHTML = html;

    while (!node.classList.contains("btnContainer")){
		node = node.parentNode;
	}
	cl = node.parentNode.classList;
	div.className = cl.contains("itemContainer") || cl.contains("nestedQuestionnaire") ? "nestedQuestionnaire" : "itemContainer";
	node.parentNode.insertBefore(div, node);
}

function _addQuestion(node){
	console.log("_addQuestion", node.getAttribute("data-obj"));

	var obj, elt, modelData, html, div, cl;

	obj = node.getAttribute("data-obj").split(";");
	elt = document.querySelector("#tplQuestion").innerHTML;
    modelData = { name: obj[0]+"["+(""+Math.random()).split(".")[1]+"]", lang: obj[1]};
    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.innerHTML = html;

    while (!node.classList.contains("btnContainer")){
		node = node.parentNode;
	}
	cl = node.parentNode.classList;
	div.className = cl.contains("itemContainer") || cl.contains("nestedQuestionnaire") ? "nestedQuestionnaire" : "itemContainer";
	node.parentNode.insertBefore(div, node);
}

function _addChoice(node){
	console.log("_addChoice", node.getAttribute("data-obj"));
	var obj, elt, modelData, html, div;

	obj = node.getAttribute("data-obj").split(";");
	elt = document.querySelector("#tplChoice").innerHTML;
    modelData = { name: obj[0]+"["+(""+Math.random()).split(".")[1]+"]", lang: obj[1]};
    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.className = "answer";
    div.innerHTML = html;

    while (!node.classList.contains("btnContainer")){
		node = node.parentNode;
	}
	node.parentNode.insertBefore(div, node);
}

function saveForm(){
	console.log("saveForm");
	var obj = form2js(document.forms.newQ);
	console.log("res", obj);

	if(obj._id){
		//Update
		Utils.promiseXHR("PUT", "/api/questionnaires/" + obj._id, 200, JSON.stringify(obj)).then(function(response) {
            alert("SUCCESS");
        }, function(error) {
            alert("FAILED");
            console.log("saveForm - error: ", error);
        });
	}
	else{
		//Creation
		Utils.promiseXHR("POST", "/api/questionnaires", 200, JSON.stringify(obj)).then(function(response) {
            alert("SUCCESS");
            //set questionnaire id
            var obj = JSON.parse(response);
            if(obj._id){
            	document.querySelector("#questionnaireID").value = obj._id;
            }
        }, function(error) {
            alert("FAILED");
            console.log("saveForm - error: ", error);
        });
	}
};