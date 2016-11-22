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
	modified = false,
	langChoice;

window.addEventListener("DOMContentLoaded", init, false);

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

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

	//init lang english
    changeLang('en');

    document.addEventListener('change', function( evt ) { 
		if( evt.target.getAttribute("id") !== "lang" ) {
			modified = true;
			document.querySelector('#lang').disabled = true;
		}
	}, true );
}

var changeLang = function(lang, from) {
	langChoice = lang;
	if(!from) {
		from = document;
	}

	var tradInputList = from.querySelectorAll('.trad-input'),
		langInfoList = from.querySelectorAll('.lang-info'),
		inputLabelUpdateList = from.querySelectorAll('.input-label-update');

	[].forEach.call(inputLabelUpdateList, function(elt) {
		var input = elt.querySelector('#'+lang);
		if(input) {
			updateLabel(input);
		}
	});

	[].forEach.call(langInfoList, function(elt) {
		elt.innerHTML = lang;
	});

	[].forEach.call(tradInputList, function(elt) {
		Utils.hideElt(elt);
	});

	[].forEach.call(tradInputList, function(elt) {
		if(elt.id === lang) {
			Utils.showElt(elt, 'trad-input');
		}
	});
};

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
    modelData = { name: obj[0]+"["+(""+Math.random()).split(".")[1]+"]"};
    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.innerHTML = html;

    while (!node.classList.contains("btnContainer")){
		node = node.parentNode;
	}
	cl = node.parentNode.classList;
	div.className = cl.contains("itemContainer") || cl.contains("nestedQuestionnaire") ? "nestedQuestionnaire" : "itemContainer";
	node.parentNode.insertBefore(div, node);

	changeLang(langChoice, div);
}

function _addQuestion(node){
	console.log("_addQuestion", node.getAttribute("data-obj"));

	var obj, elt, modelData, html, div, cl;

	obj = node.getAttribute("data-obj").split(";");
	elt = document.querySelector("#tplQuestion").innerHTML;
    modelData = { name: obj[0]+"["+(""+Math.random()).split(".")[1]+"]"};
    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.innerHTML = html;

    while (!node.classList.contains("btnContainer")){
		node = node.parentNode;
	}
	cl = node.parentNode.classList;
	div.className = cl.contains("itemContainer") || cl.contains("nestedQuestionnaire") ? "nestedQuestionnaire" : "itemContainer";
	node.parentNode.insertBefore(div, node);

	changeLang(langChoice, div);
}

function _addChoice(node){
	console.log("_addChoice", node.getAttribute("data-obj"));
	var obj, elt, modelData, html, div;

	obj = node.getAttribute("data-obj").split(";");
	elt = document.querySelector("#tplChoice").innerHTML;
    modelData = { name: obj[0]+"["+(""+Math.random()).split(".")[1]+"]"};
    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.className = "answer";
    div.innerHTML = html;

    while (!node.classList.contains("btnContainer")){
		node = node.parentNode;
	}
	node.parentNode.insertBefore(div, node);

	changeLang(langChoice, div);
}

function saveForm(){
	console.log("saveForm");
	var obj = form2js(document.forms.newQ);
	console.log("res", obj);

	delete obj.lang;

	if(obj._id){
		//Update
		Utils.promiseXHR("PUT", "/api/questionnaires/" + obj._id, 200, JSON.stringify(obj)).then(function(response) {
            new Modal('updateSuccess', function() {
            	modified = false;
            	document.querySelector('#lang').disabled = false;
            });

        }, function(error) {
            new Modal('errorOccured');
            console.log("saveForm - error: ", error);
        });
	}
	else{
		//Creation
		Utils.promiseXHR("POST", "/api/questionnaires", 200, JSON.stringify(obj)).then(function(response) {
            new Modal('saveSuccess', function() {
            	modified = false;
            	document.querySelector('#lang').disabled = false;
            });
            //set questionnaire id
            var obj = JSON.parse(response);
            if(obj._id){
            	document.querySelector("#questionnaireID").value = obj._id;
            }
        }, function(error) {
            new Modal('errorOccured');
            console.log("saveForm - error: ", error);
        });
	}
};