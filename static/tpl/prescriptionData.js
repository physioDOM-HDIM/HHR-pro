"use strict";

var utils = new Utils(),
    infos = {},
    lists = {};

window.addEventListener("DOMContentLoaded", function() {

    infos.category = document.querySelector('.param-category').innerText;
    infos.lang = document.querySelector('#lang').innerText;
    getList();

}, false);


/**
 * Getting dataprog
 */

var getList = function() {
    var promises = {
            //dataprog: /api/beneficiary/dataprog,
            parameterList: utils.promiseXHR("GET", "/api/lists/"+infos.category, 200)
        };

    RSVP.hash(promises).then(function(results) {

        //TODO Mock to delete when integrating with backend
        lists.dataprog = [{
            "category": "General",
            "ref": "TEMP",
            "frequency": "weekly",
            "repeat": 5,
            "startDate": "2014-12-20",
            "endDate": "2014-12-20",
            "when": [{
                "days": [5,2,3,1]
            }]
        },{
            "category": "General",
            "ref": "APS",
            "frequency": "weekly",
            "repeat": 2,
            "startDate": "2014-12-20",
            "endDate": "2014-12-20",
            "when": [{
                "days": [1,3]
            }]
        },{
            "category": "General",
            "ref": "APD",
            "frequency": "monthly",
            "repeat": 9,
            "startDate": "2014-12-20",
            "endDate": "2014-12-20",
            "when": [{
                "days": [1,3]
            }]
        }];

        lists.parameters = JSON.parse(results.parameterList);

        var i = 0,
        leni = lists.parameters.items.length;

        for(i; i<leni; i++) {
            lists.parameters.items[i].labelLang = lists.parameters.items[i].label[infos.lang];
        }

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

    minContainer.innerText = param.threshold.min;
    maxContainer.innerText = param.threshold.max;
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
                    if (dataItem.when[0].days.indexOf(parseInt(render(val))) > -1) {
                        return 'checked';
                    }
                };
            }
        };


    formDiv.classList.add('modalContainer');
    formDiv.innerHTML = Mustache.render(formTpl.innerHTML, dataModel);

    formContainer.appendChild(formDiv);

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

    if(param) {
        data.category = param.category;
    }

    if(data.repeat) {
        data.repeat = parseFloat(data.repeat);
    }

    if(data.when) {
        var i = 0,
            len = data.when.days.length;

        for(i; i<len; i++) {
            data.when.days[i] = parseInt(data.when.days[i]);
        }
    }

    console.log(data);

    utils.promiseXHR("POST", "/api/beneficiary/dataprog/"+data.ref, 200, JSON.stringify(data)).then(function() {
        new Modal('createSuccess');
    }, function(error) {
        new Modal('errorOccured');
        console.log("saveData - error: ", error);
    });
};


var removeData = function(ref) {
    //TODO call to unknown service to remove only 1 param with ref in arg

    new Modal('confirmDeleteItem', function() {
        console.log('call to unknown service to remove only 1 param with ref in arg', ref);
    });

};