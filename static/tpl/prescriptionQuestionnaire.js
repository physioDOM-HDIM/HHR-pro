"use strict";

var utils = new Utils(),
    infos = {},
    lists = {};

window.addEventListener("DOMContentLoaded", function() {

    infos.lang = document.querySelector('#lang').innerText;
    getList();

}, false);


/**
 * Getting questionnaireProg
 */

var getList = function() {
    var promises = {
            //questionnaireProg: No API yet,
        };

    RSVP.hash(promises).then(function(results) {

        //MOCK to delete when integrating with backend
        lists.questionnaireProg = [{
            "_id": "54789f2b2d88c6524b345cf5",
            "name": "CHAIR_TEST",
            "ref": "The 30-Second Chair Stand Test",
            "label": {
                "en": "The 30-Second Chair Stand Test"
            },
            "frequency": "anytime !",
            "comment": "This is fun to do !",
            "dates": ["2014-07-28", "2015-02-07"]
        }];
        //ENDMOCK

        init();

    });
};

/**
 * Data Binding / Templating
 */

var init = function() {
    var questionnaireProgTpl = document.querySelector('#tpl-questionnaire-prog'),
        questionnaireProgContainer = document.querySelector('.questionnaire-prog-list'),
        i = 0,
        len = lists.questionnaireProg.length;

    for(i; i<len; i++) {

        lists.questionnaireProg[i].labelLang = lists.questionnaireProg[i].label[infos.lang];

        var dataItem = lists.questionnaireProg[i],
            dataModel = {
                data: dataItem
            };

        var questionnaireContainer = document.createElement("div");
        questionnaireContainer.classList.add('data-item');
        questionnaireContainer.innerHTML = Mustache.render(questionnaireProgTpl.innerHTML, dataModel);

        questionnaireProgContainer.appendChild(questionnaireContainer);
    }
};

/**
 * Action on form
 */

var saveData = function() {
    //No API yet
};