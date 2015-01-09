"use strict";

var utils = new Utils(),
    infos = {},
    lists = {};

/**
 * Getting dataprog
 */

var getList = function() {
    var promises = {
            dataprog: utils.promiseXHR("GET", "/api/beneficiary/dataprog/"+infos.category,200),
            parameterList: utils.promiseXHR("GET", "/api/lists/"+infos.paramList, 200),
            thresholds: utils.promiseXHR("GET", "/api/beneficiary/thresholds", 200)
        };

    RSVP.hash(promises).then(function(results) {
        // //MOCK to delete when integrating with backend
        // if(infos.category === 'parameters' && infos.subcategory === 'General') {
        //     lists.dataprog = [
        //         {
        //             "category": "general",
        //             "ref": "TEMP",
        //             "frequency": "weekly",
        //             "repeat": 5,
        //             "startDate": "2014-12-20",
        //             "endDate": "2014-12-20",
        //             "when": [
        //                 { "days": [5,2,3,1] }]
        //         },{
        //             "category": "General",
        //             "ref": "APS",
        //             "frequency": "weekly",
        //             "repeat": 2,
        //             "startDate": "2014-12-20",
        //             "endDate": "2014-12-20",
        //             "when": [
        //                 { "days": [1,3] }]
        //         }
        //     ];
        // } else if(infos.category === 'parameters' && infos.subcategory === 'HDIM') {
        //     lists.dataprog = [{
        //         "category": "HDIM",
        //         "ref": "WEG",
        //         "frequency": "monthly",
        //         "repeat": 4,
        //         "startDate": "2014-12-20",
        //         "endDate": "2014-12-20",
        //         "when": [{
        //             "days": [2,1]
        //         }]
        //     }];
        // } else if(infos.category === 'symptom') {
        //     lists.dataprog = [{
        //         "category": "symptom",
        //         "ref": "PAIN",
        //         "frequency": "monthly",
        //         "repeat": 4,
        //         "startDate": "2014-12-20",
        //         "endDate": "2014-12-20",
        //         "when": [{
        //             "days": [2,3,1]
        //         }]
        //     }];
        // }
        // //ENDMOCK
        lists.dataprog = JSON.parse(results.dataprog);
        lists.parameters = JSON.parse(results.parameterList);
        lists.thresholds = JSON.parse(results.thresholds);

        for(var i = 0, leni = lists.parameters.items.length; i<leni; i++) {
            lists.parameters.items[i].labelLang = lists.parameters.items[i].label[infos.lang];
            lists.parameters.items[i].threshold = lists.thresholds[lists.parameters.items[i].ref];
        }
        console.log(lists.parameters.items);
        init();

    });
};

/**
 * Data Binding / Templating
 */

var init = function() {
    var dataprogTpl = document.querySelector('#tpl-dataprog'),
        dataprogContainer = document.querySelector('.dataprog-list'),
        i = 0,
        len = lists.dataprog.length;

    for(i; i<len; i++) {

        var dataItem = lists.dataprog[i],
            param = utils.findInObject(lists.parameters.items, 'ref', dataItem.ref),
            dataModel = {
                param: param,
                data: dataItem,
                getDay: function () {
                    return function(val, render) {
                        return utils.getDayName(parseInt(render(val)));
                    };
                }
            };

        var dataContainer = document.createElement("div");
        dataContainer.classList.add('data-item');
        dataContainer.innerHTML = Mustache.render(dataprogTpl.innerHTML, dataModel);

        dataprogContainer.appendChild(dataContainer);
    }
};

var updateParam = function(elt) {
    var container = elt.parentNode.parentNode,
        ref = elt.value,
        minContainer = container.querySelector('.min-threshold'),
        maxContainer = container.querySelector('.max-threshold'),
        param = utils.findInObject(lists.parameters.items, 'ref', ref);

    if(param.threshold) {
        minContainer.innerText = param.threshold.min;
        maxContainer.innerText = param.threshold.max;
    }
};

var showOptions = function(frequency, dataModel) {

    var optionsContainer = document.querySelector('.frequency-options'),
        weeklyTpl = document.querySelector('#tpl-option-weekly'),
        monthlyTpl = document.querySelector('#tpl-option-monthly');

    if(frequency === 'weekly') {
        optionsContainer.innerHTML = Mustache.render(weeklyTpl.innerHTML, dataModel);
    } else if(frequency === 'monthly') {
        optionsContainer.innerHTML = Mustache.render(monthlyTpl.innerHTML, dataModel);
    } else {
        optionsContainer.innerHTML = '';
    }

};

/**
 * Modal Form
 */

function showForm(ref) {

    var formTpl = document.querySelector('#tpl-form'),
        modal = document.querySelector("#editModal"),
        formContainer = document.querySelector("#dataprog-form"),
        formDiv = document.createElement('div'),
        dataItem = {},
        param = {};

    if(ref) {
        dataItem = utils.findInObject(lists.dataprog, 'ref', ref);
        param = utils.findInObject(lists.parameters.items, 'ref', ref);
    }

    var dataModel = {
            paramList: lists.parameters.items,
            param: param,
            data: dataItem,
            selection: function () {
                return function(val, render) {
                    if(ref === render(val)) {
                        return 'selected';
                    }
                };
            },
            getFrequencyDefault: function () {
                return function(val, render) {
                    if(dataItem.frequency === render(val)) {
                        return 'checked';
                    }
                };
            },
            getDaysDefault: function() {
                return function(val, render) {
                    console.log(dataItem.when);
                    if (dataItem.when.days.indexOf(parseInt(render(val))) > -1) {
                        return 'checked';
                    }
                };
            }
        };


    formDiv.classList.add('modalContainer');
    formDiv.innerHTML = Mustache.render(formTpl.innerHTML, dataModel);

    formContainer.appendChild(formDiv);


    //Set threshold for first param of the list
    var select = formContainer.querySelector('#ref-select');
    updateParam(select);
    //show default frequency option template
    showOptions(dataItem.frequency, dataModel);

    modal.show();
}

function closeForm() {
    var modal = document.querySelector("#editModal"),
        formContainer = document.querySelector("#dataprog-form");

    formContainer.innerHTML = '';

    modal.hide();
}

/**
 * Action on form
 */

var saveData = function() {

    var data = form2js(document.forms.dataprog),
        param = utils.findInObject(lists.parameters.items, 'ref', data.ref);

    data.ref = data.ref;
    data.category = infos.category;

    if(data.repeat) {
        data.repeat = parseFloat(data.repeat);
    }

    if(data.when) {
        var i = 0,
            len = data.when.days.length;

        for(i; i<len; i++) {
            data.when.days[i] = parseInt(data.when.days[i]);
        }

        if(data.when.week) {
            data.when.week = parseInt(data.when.week);
        }
    }

    console.log(data);

    utils.promiseXHR('POST', '/api/beneficiary/dataprog', 200, JSON.stringify(data)).then(function() {
        new Modal('createSuccess', function() {
            window.location.href = "/prescription/"+ infos.category.toLowerCase();
        });
    }, function(error) {
        new Modal('errorOccured');
        console.log("saveData - error: ", error);
    });
};


var removeData = function(id) {

    var deleteAction = function() {
        utils.promiseXHR("DELETE", "/api/beneficiary/dataprog/"+id, 200).then(function() {
            new Modal('deleteSuccess', function() {
                window.location.href = "/prescription/"+ infos.category.toLowerCase();
            });
        }, function(error) {
            new Modal('errorOccured');
            console.log("saveData - error: ", error);
        });
    };

    new Modal('confirmDeleteItem', deleteAction);
};

window.addEventListener("DOMContentLoaded", function() {
    infos.category = document.querySelector('.param-category').innerText;
    infos.paramList = document.querySelector('.param-list').innerText;
    infos.lang = document.querySelector('#lang').innerText;
    getList();

}, false);