'use strict';

var answerData = {};

function closeModal() {
	if (window.parent.onQuestionnaireValidate) {
		var name = document.getElementById('questionnaireName').innerHTML;
		window.parent.onQuestionnaireValidate(name, answerData.date, answerData.score, answerData.answerID);
	}
}

function showModal() {
	document.getElementById('statusModal').show();
}

function checkForm() {
	var obj = form2js(document.querySelector("form[name='questionnaire']"));

	var sum = 0;
	var compute = function(tab){
		var item, tmp, res = 0;
		for (var i = 0; i < tab.length; i++) {
			item = tab[i];
			if (item.questions){
				sum += compute(item.questions);
				if (item.subscore){
					sum = eval(item.subscore);
				}
				tmp = parseFloat(sum);
				if (!isNaN(tmp)) {
					res += parseFloat(tmp);
				}
				sum = 0;
			}
			else {
				tmp = parseFloat(item.choice);
				if (!isNaN(tmp)) {
					res += tmp;
					item.choice = tmp;
				}
			}
		}

		return res;
	};

	var res = compute(obj.questions);
	obj.score = parseFloat(res);
	//TODO : utiliser le parseFloat sur l'obj retourné par form2js, car se sont des strings
	//Ajouter les propriétés necessaire et envoyer l'object au server pour sauvegarde dans la base

	var scoreElt = document.getElementById('score');
	scoreElt.innerHTML = '' + obj.score;

	promiseXHR('POST', '../api/beneficiary/questionnaires/' + obj.ref + '/answers', 200, JSON.stringify(obj))
		.then(function(res) {
			var result = JSON.parse(res);
			answerData.answerID = result._id;
			answerData.date = result.datetime;
			answerData.score = result.score;
			showModal();
		}, function(error) {
			console.log(error);
		});
}
