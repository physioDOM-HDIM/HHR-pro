"use strict";

var utils = new Utils(),
    infos = {},
    questionnairePlan = [],
    idx = 0,
    dateIdx = 0,
    modified = false;

window.addEventListener("DOMContentLoaded", function() {

    infos.lang = Cookies.get("lang");
    getList();

}, false);


/**
 * Getting questionnaireProg
 */

var getList = function() {
    utils.promiseXHR("GET", "/api/beneficiary/questprog", 200)
        .then( function ( results ) {
            questionnairePlan = JSON.parse(results);
            init();
        });
};

/**
 * Data Binding / Templating
 */

var init = function() {
    var questionnaireProgTpl = document.querySelector('#tpl-questionnaire-prog'),
        questionnaireProgContainer = document.querySelector('.questionnaire-prog-list');

    for(var i= 0, len=questionnairePlan.length ; i<len; i++) {
        var dataItem = questionnairePlan[i];
        dataItem.labelLang = dataItem.label[infos.lang] || dataItem.ref;
        
        var dataModel = {
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
    
    var inputs = document.querySelectorAll("input");
    [].slice.call(inputs).forEach( function(input) {
        input.addEventListener("change", function (evt) {
            modified = true;
        }, false);
    });
};

var addDate = function(elt, idx) {
    var dateValue = elt.parentNode.querySelector('#date').value,
        dateContainer = elt.parentNode.parentNode.parentNode.querySelector('.dates-list'),
        dateAddedTpl = document.querySelector('#dateAddedTpl');

    if(dateValue && utils.parseDate(dateValue)) {
        dateContainer.innerHTML += Mustache.render(dateAddedTpl.innerHTML, {dateValue: dateValue, idx: idx, dateIdx: dateIdx});
        elt.parentNode.querySelector('#date').value = "";
        dateIdx++;
        modified = true;
    }
};

var removeDate = function(elt) {
    var li = elt.parentNode,
        dateContainer = li.parentNode;

    dateContainer.removeChild(li);
    modified = true;
};

/**
 * Action on form
 */

var saveData = function( ) {
    //Call to API (No API defined yet)
    var data = form2js(document.forms.questionnaire);
    var promises = data.questionnaire.map( function( questionnaire ) {
        return utils.promiseXHR("PUT", "/api/beneficiary/questprog", 200, JSON.stringify(questionnaire))
    });
    
    RSVP.all( promises )
        .then( function() {
            console.log("all saved");
            modified = false;
            new Modal('saveSuccess', function() { });
        })
        .catch( function() {
            new Modal('errorOccured', function() { });
        });
};

window.addEventListener("beforeunload", function( e) {
    var confirmationMessage;
    if(modified) {
        confirmationMessage = document.querySelector("#unsave").innerHTML;
        (e || window.event).returnValue = confirmationMessage;     //Gecko + IE
        return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
    }
});