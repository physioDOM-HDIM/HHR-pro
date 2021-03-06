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

var answerData = {};

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
					console.log( item.subscore );
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
	obj.score = parseFloat(res.toFixed(1));
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

			new Modal('infoQuestionnaireResult', function() {
				if (window.parent.onQuestionnaireValidate) {
					var name = document.getElementById('questionnaireName').innerHTML;
					window.parent.onQuestionnaireValidate(name, answerData.date, answerData.score, answerData.answerID);
				}
			});

		}, function(error) {
			console.log(error);
		});
}
