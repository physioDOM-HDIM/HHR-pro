"use strict";

var infos = {},
    lists = {};

var promiseXHR = function(method, url, statusOK, data) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        var client = new XMLHttpRequest();
        statusOK = statusOK ? statusOK : 200;
        client.open(method, url);
        client.onreadystatechange = function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === statusOK) {
                    resolve(this.response);
                } else {
                    reject(this);
                }
            }
        };
        client.send(data ? data : null);
    });

    return promise;
};

function getDayName(day) {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][day];
}

function findInObject(obj, item, value) {
    var i = 0,
        len = obj.length,
        result = null;

    for(i; i<len; i++) {
        if(obj[i][item] === value) {
            result = obj[i];
            break;
        }
    }

    return result;
}


var openModalEdition = function(ref) {
    showModal(ref);
}

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

var init = function() {
    var dataprogTpl = document.querySelector('#tpl-dataprog'),
        dataprogContainer = document.querySelector('.dataprog-list'),
        i = 0,
        len = lists.dataprog.length;

    for(i; i<len; i++) {

        var dataItem = lists.dataprog[i],
            param = findInObject(lists.parameters.items, 'ref', dataItem.ref),
            dataModel = {
                param: param,
                data: dataItem,
                getDay: function () {
                    return function(val, render) {
                        return getDayName(parseInt(render(val)));
                    }
                }
            };

        var dataContainer = document.createElement("div");
        dataContainer.classList.add('data-item');
        dataContainer.innerHTML = Mustache.render(dataprogTpl.innerHTML, dataModel);

        dataprogContainer.appendChild(dataContainer);
    }
};

var getList = function() {
    var promises = {
            //dataprog: /api/beneficiary/dataprog,
            parameterList: promiseXHR("GET", "/api/lists/"+infos.category, 200)
        };

    RSVP.hash(promises).then(function(results) {

        //Mock
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

window.addEventListener("DOMContentLoaded", function() {
    infos.category = document.querySelector('.param-category').innerText;
    infos.lang = document.querySelector('#lang').innerText;
    getList();
}, false);

/* Modal */
function closeModal() {
    var modal = document.querySelector("#editModal"),
        formContainer = document.querySelector("#dataprog-form");

    formContainer.innerHTML = '';

    modal.hide();
}


function showModal(ref) {

    var formTpl = document.querySelector('#tpl-form'),
        modal = document.querySelector("#editModal"),
        formContainer = document.querySelector("#dataprog-form"),
        formDiv = document.createElement('div'),
        dataItem = findInObject(lists.dataprog, 'ref', ref),
        param = findInObject(lists.parameters.items, 'ref', ref),
        dataModel = {
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

function updateParam(elt) {
    var container = elt.parentNode.parentNode,
        ref = elt.value,
        minContainer = container.querySelector('.min-threshold'),
        maxContainer = container.querySelector('.max-threshold'),
        param = findInObject(lists.parameters.items, 'ref', ref);

    minContainer.innerText = param.threshold.min;
    maxContainer.innerText = param.threshold.max;
}



/* Action on form */

var saveData = function() {

    var data = form2js(document.forms.dataprog);
    data.category = infos.category;
    data.repeat = parseFloat(data.repeat);

    var i = 0,
        len = data.when.days.length;

    for(i; i<len; i++) {
        data.when.days[i] = parseInt(data.when.days[i]);
    }

    console.log(data);
    ///api/beneficiary/dataprog/:ref
};