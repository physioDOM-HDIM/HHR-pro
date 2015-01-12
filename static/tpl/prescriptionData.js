"use strict";

var utils = new Utils(),
    infos = {},
    lists = {};

/**
 * Getting dataprog
 */

var getList = function() {
    var promises = {
            dataprog: utils.promiseXHR("GET", "/api/beneficiary/dataprog/"+( infos.category || infos.paramList ),200),
            parameterList: utils.promiseXHR("GET", "/api/lists/"+infos.paramList, 200),
            // thresholds: utils.promiseXHR("GET", "/api/beneficiary/thresholds", 200)
        };

    RSVP.hash(promises).then(function(results) {
        lists.dataprog = JSON.parse(results.dataprog);
        lists.parameters = JSON.parse(results.parameterList);
        if(infos.category) {
            lists.parameters.items =  lists.parameters.items.filter( function(item) {
                return item.category === infos.category;
            });
        }
        // lists.thresholds = JSON.parse(results.thresholds);

        for(var i = 0, leni = lists.parameters.items.length; i<leni; i++) {
            lists.parameters.items[i].labelLang = lists.parameters.items[i].label[infos.lang];
            /*
            if(lists.thresholds[lists.parameters.items[i].ref]) {
                lists.parameters.items[i].threshold = lists.thresholds[lists.parameters.items[i].ref];
            }
            */
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
            param = utils.findInObject(lists.parameters.items, 'ref', dataItem.ref);

        //translate options of weekly and montly for the template
        if(dataItem.frequency === 'monthly') {
            dataItem.frequencyType = 'month';
            dataItem.hasDetail = true;
            dataItem.hasMoreDetail = true;

            var weekNumber = Number(String(Math.abs(dataItem.when.days[0])).charAt(0));

            if(weekNumber === 1) {
                dataItem.when.weekNumber = 'first';
            } else if(weekNumber === 2){
                dataItem.when.weekNumber = 'second';
            } else if(weekNumber === 3){
                dataItem.when.weekNumber = 'third';
            } else if(weekNumber === 4){
                dataItem.when.weekNumber = 'fourth';
            }

            if(dataItem.when.days[0] > 0) {
                dataItem.when.order = 'beginning';
            } else {
                dataItem.when.order = 'end';
            }
        } else if (dataItem.frequency === 'weekly') {
            dataItem.frequencyType = 'week';
            dataItem.hasDetail = true;
            dataItem.hasMoreDetail = false;
        } else {
            dataItem.hasDetail = false;
            dataItem.hasMoreDetail = false;
        }

        var dataModel = {
                param: param,
                data: dataItem,
                getDay: function () {
                    return function(val, render) {
                        var dayNumber = Number(String(Math.abs(render(val))).charAt(1));
                        return utils.getDayName(dayNumber);
                    };
                },
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
        param = utils.findInObject(lists.parameters.items, 'ref', ref);
        // minContainer = container.querySelector('.min-threshold'),
        // maxContainer = container.querySelector('.max-threshold'),
    
    /*
    if(param.threshold) {
        minContainer.innerText = param.threshold.min;
        maxContainer.innerText = param.threshold.max;
    }
    */
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
                    var tmp = [];
                    if( dataItem.frequency === "monthly" ) {
                        for( var i= 0, l=dataItem.when.days.length; i < l; i++) {
                            tmp.push ( Math.abs(dataItem.when.days[i] % 10 ));
                        }
                    } else {
                        tmp = dataItem.when.days;
                    }
                    if (tmp.indexOf(parseInt(render(val))) > -1) {
                        return 'checked';
                    }
                };
            },
            getWeekDefault: function() {
                return function(val, render) {
                    if(Math.abs(parseInt(dataItem.when.days[0]/10)) === parseInt(render(val),10)) {
                        return 'selected';
                    }
                };
            },
            getStartDefault: function() {
                return function(val, render) {
                    if( parseInt(render(val),10) * dataItem.when.days[0] > 0 ) {
                        return 'selected';
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
        param = utils.findInObject(lists.parameters.items, 'ref', data.ref),
        dataprog = {};

    dataprog.ref = data.ref;
    dataprog.category = infos.category || infos.paramList;
    dataprog.startDate = data.startDate;
    dataprog.endDate = data.endDate;
    dataprog.frequency = data.frequency;

    if(data.repeat) {
        dataprog.repeat = parseInt(data.repeat,10);
    }

    if(data.when) {
        var i = 0,
            len = data.when.days.length;

        dataprog.when = {};
        dataprog.when.days = [];

        for(i; i<len; i++) {
            dataprog.when.days[i] = parseInt(data.when.days[i],10);
            if(data.when.week) {
                dataprog.when.days[i] = parseInt(data.when.order,10) * ( parseInt(data.when.week,10)*10 + parseInt(data.when.days[i],10) );
            }
        }
    }

    console.log(data);

    utils.promiseXHR('POST', '/api/beneficiary/dataprog', 200, JSON.stringify(dataprog)).then(function() {
        new Modal('createSuccess', function() {
            window.location.href = "/prescription/"+ ( infos.category || infos.paramList ).toLowerCase();
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
    infos.category = document.querySelector('.param-category').textContent;
    infos.paramList = document.querySelector('.param-list').textContent;
    infos.lang = document.querySelector('#lang').textContent;
    getList();

}, false);