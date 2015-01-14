"use strict";

// var promiseXHR = function(method, url, statusOK, data) {
//     var promise = new RSVP.Promise(function(resolve, reject) {
//         var client = new XMLHttpRequest();
//         statusOK = statusOK ? statusOK : 200;
//         client.open(method, url);
//         client.onreadystatechange = function handler() {
//             if (this.readyState === this.DONE) {
//                 if (this.status === statusOK) {
//                     resolve(this.response);
//                 } else {
//                     reject(this);
//                 }
//             }
//         };
//         client.send(data ? data : null);
//     });

//     return promise;
// };

function closeModal() {
	history.back();
}

function showModal() {
	document.querySelector("#statusModal").show();
}

function checkForm() {
	var obj = form2js(document.querySelector("form[name='questionnaire']"));

	var sum = 0;
	var compute = function(tab) {
		var item, tmp, res = 0;
		for (var i = 0; i < tab.length; i++) {
			item = tab[i];
			if (item.questions) {
				sum += compute(item.questions);
				if (item.subscore) {
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
			console.log(res);
		}, function(error) {
			console.log(error);
		});

	showModal();
}
