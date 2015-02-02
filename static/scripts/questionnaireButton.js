'use strict';

var states = 0;

function onIframeLoaded() {
	document.getElementById('content').style.display = 'none';
	document.getElementById('questionnaireIframe').classList.add('visible');
}

function loadQuestionnaire(url) {
	var iframe = document.createElement('iframe');
	iframe.id = 'questionnaireIframe';
	iframe.setAttribute('scrolling', 'no');
	iframe.addEventListener('load', onIframeLoaded);
	document.documentElement.appendChild(iframe);
	iframe.src = url;
}

function onQuestionnaireValidate(name, date, score, answerID) {

	// history.back();

	var eltDate = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-date');
	var eltScore = document.querySelectorAll('.questionnaire-row[data-name="' + name + '"] .questionnaire-score');
	var eltAnswerId = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-answer');
	var eltAnswerText = document.querySelector('.questionnaire-row[data-name="' + name + '"] .questionnaire-text');
	var select = document.querySelector('.questionnaire-row[data-name="' + name + '"] select');

	if (select) {
		eltAnswerText.value = select.value;
		select.disabled = true;
	}

	if (eltDate) {
		eltDate.innerHTML = moment(date, moment.ISO_8601).format('L');
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

	document.getElementById('questionnaireIframe').parentNode.removeChild(document.getElementById('questionnaireIframe'));
	document.getElementById('content').style.display = '';
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
	console.log(answerID);
	var iframe = document.createElement('iframe');
	iframe.id = 'questionnaireIframe';
	iframe.setAttribute('scrolling', 'no');
	iframe.addEventListener('load', onIframeLoaded);
	document.documentElement.appendChild(iframe);
	iframe.src = "/answers/"+answerID;
}

function closeAnswer() {
	document.getElementById('questionnaireIframe').parentNode.removeChild(document.getElementById('questionnaireIframe'));
	document.getElementById('content').style.display = '';
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