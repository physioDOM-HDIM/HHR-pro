"use strict";

var utils = new Utils(),
    infos = {},
    lists = {},
    idx = 0,
    dateIdx = 0;

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
        }, {
            "_id": "547d88c28a2872333a2a1c83",
            "name": "MMSE",
            "ref": "Mini-Mental State Examination",
            "label": {
                "en": "Mini-Mental State Examination"
            },
            "frequency": "every monday !",
            "comment": "Be very serious on this one !",
            "dates": ["2014-07-20"]
        },{
            "_id": "547d94008a2872333a2a1c88",
            "name": "SF36",
            "ref": "Short Form Health Survey",
            "label": {
                "en": "Short Form Health Survey"
            },
            "frequency": "I don't know, whenever you want to do it",
            "comment": "If you want to do it anyway...",
            "dates": ["2014-02-10", "2015-01-01"]
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
                idx: idx,
                data: dataItem,
                setAddedDate: function() {
                    return function(val, render) {
                        var dateAddedTpl = document.querySelector('#dateAddedTpl');
                        var dateIndex = dateIdx;
                        dateIdx++;

                        return Mustache.render(dateAddedTpl.innerHTML, {dateValue: render(val), idx: idx, dateIdx: dateIndex});
                    };
                }
            };

        var questionnaireContainer = document.createElement("div");
        questionnaireContainer.classList.add('data-item');
        questionnaireContainer.innerHTML = Mustache.render(questionnaireProgTpl.innerHTML, dataModel);

        questionnaireProgContainer.appendChild(questionnaireContainer);
        idx++;
    }
};

var addDate = function(elt, idx) {
    var dateValue = elt.parentNode.querySelector('#date').value,
        dateContainer = elt.parentNode.parentNode.parentNode.querySelector('.dates-list'),
        dateAddedTpl = document.querySelector('#dateAddedTpl');

    if(dateValue && utils.parseDate(dateValue)) {
        dateContainer.innerHTML += Mustache.render(dateAddedTpl.innerHTML, {dateValue: dateValue, idx: idx, dateIdx: dateIdx});
        elt.parentNode.querySelector('#date').value = "";
        dateIdx++;
    }
};

var removeDate = function(elt) {
    var li = elt.parentNode,
        dateContainer = li.parentNode;

    dateContainer.removeChild(li);
};

/**
 * Action on form
 */

var saveData = function() {
    //Call to API (No API defined yet)
    var data = form2js(document.forms.questionnaire);
    console.log(data.questionnaire);
};