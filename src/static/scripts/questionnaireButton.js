'use strict';

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

var states = 0;

function onIframeLoaded() {
	document.getElementById('content').style.display = 'none';
	document.getElementById('questionnaireIframe').classList.add('visible');
}

function loadQuestionnaire(url) {
	var elt = document.querySelector("div#questionnaireContainer");
	var iframe = document.createElement('iframe');
	iframe.id = 'questionnaireIframe';
	iframe.setAttribute('scrolling', 'no');
	iframe.addEventListener('load', onIframeLoaded);
	if( !elt ) {
		document.documentElement.appendChild(iframe);
	} else {
		elt.appendChild(iframe);
	}
	iframe.src = url;
}

function onQuestionnaireValidate(name, date, score, answerID) {

	// history.back();

	var eltDate = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-date');
	var eltScore = document.querySelectorAll('.questionnaire-row[data-name="' + name + '"] .questionnaire-score');
	var eltAnswerId = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-answer');
	var eltAnswerText = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-text');
	var eltAnswerDate = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-dateFormat');
	var select = document.querySelector('.questionnaire-row[data-name="' + name + '"] select');

	if (select) {
		eltAnswerText.value = select.value;
		select.disabled = true;
	}

	if (eltDate) {
		eltDate.innerHTML = moment(date, moment.ISO_8601).format('L');
		if(eltAnswerDate) { eltAnswerDate.value = date; }
	}

	if (eltScore.length) {
		[].slice.call(eltScore).forEach( function(elt) {
			elt.value = score;
			elt.readonly = true;
		});
	}

	if (eltAnswerId) {
		eltAnswerId.value = answerID;
	}
	document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-button-container a.button').setAttribute('href', '/answers/' + answerID);
	var rmButton = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-button-container button');
	if( rmButton ) {
		rmButton.classList.remove("hidden");
		rmButton.setAttribute("data-answer",answerID);
	}
	
	document.getElementById('questionnaireIframe').parentNode.removeChild(document.getElementById('questionnaireIframe'));
	document.getElementById('content').style.display = '';

	if(validateChecking) {
		validateChecking();
	}
}

function closeQuestionnaire() {
	// history.back();
	document.getElementById('questionnaireIframe').parentNode.removeChild(document.getElementById('questionnaireIframe'));
	document.getElementById('content').style.display = '';
}

function onQuestionnaireButtonClick(e) {
	var url = e.target.getAttribute('href');
	if (url) {
		loadQuestionnaire(url);
		history.pushState({questionnaireUrl: e.target.getAttribute('href')}, window.title, window.location.href);
	}

	e.preventDefault();
	return false;
}

function showAnswer(answerID) {
	// console.log(answerID);
	var elt = document.querySelector("div#questionnaireContainer");
	var iframe = document.createElement('iframe');
	iframe.id = 'questionnaireIframe';
	iframe.setAttribute('scrolling', 'no');
	iframe.addEventListener('load', onIframeLoaded);
	if( !elt ) {
		document.documentElement.appendChild(iframe);
	} else {
		elt.appendChild(iframe);
	}
	iframe.src = "/answers/"+answerID;
}

function closeAnswer() {
	document.getElementById('questionnaireIframe').parentNode.removeChild(document.getElementById('questionnaireIframe'));
	document.getElementById('content').style.display = '';
}

function removeAnswer( button ) {
	var answerID = button.getAttribute("data-answer");
	var questionnaireName = button.parentNode.parentNode.getAttribute("data-name");
	
	var eltDate = document.querySelector('.questionnaire-row[data-name="' + questionnaireName + '"] .questionnaire-date');
	var eltScore = document.querySelectorAll('.questionnaire-row[data-name="' + questionnaireName + '"] .questionnaire-score');
	var eltAnswerId = document.querySelector('.questionnaire-row[data-name="' + questionnaireName + '"] .questionnaire-answer');
	var eltAnswerText = document.querySelector('.questionnaire-row[data-name="' + questionnaireName + '"] .questionnaire-text');
	var eltAnswerDate = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-dateFormat');
	var select = document.querySelector('.questionnaire-row[data-name="' + questionnaireName + '"] select');

	if (select) {
		select.disabled = false;
	}

	if (eltDate) {
		eltDate.innerHTML = "";
		if(eltAnswerDate) { eltAnswerDate.value = ""; }
	}

	if (eltScore.length) {
		[].slice.call(eltScore).forEach( function(elt) {
			elt.value = "";
			elt.readonly = false;
		});
	}

	if (eltAnswerId) {
		eltAnswerId.value = "";
	}
	document.querySelector('.questionnaire-row[data-name="' + questionnaireName + '"] .questionnaire-button-container a.button').setAttribute('href', '/questionnaire/'+questionnaireName);
	
	var rmButton = document.querySelector('.questionnaire-row[data-name="' + questionnaireName + '"] .questionnaire-button-container button');
	if( rmButton ) {
		rmButton.classList.add("hidden");}
	
}

window.onpopstate = function(event) {
	if (document.getElementById('questionnaireIframe')) {
		document.getElementById('questionnaireIframe').parentNode.removeChild(document.getElementById('questionnaireIframe'));
	}

	if (event.state && event.state.questionnaireUrl) {
		loadQuestionnaire(event.state.questionnaireUrl);
	}
	else {
		document.getElementById('content').style.display = '';
	}
};

document.addEventListener('DOMContentLoaded', function() {

	var qButtons = document.querySelectorAll('.questionnaire-button-container a.button');

	for (var i = 0; i < qButtons.length; i++) {
		qButtons[i].addEventListener('click', onQuestionnaireButtonClick);
	}
});