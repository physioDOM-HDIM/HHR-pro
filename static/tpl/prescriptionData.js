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


var openModalEdition = function() {
    showModal();
}

var showOptions = function(frequency) {

    var optionsContainer = document.querySelector('.frequency-options'),
        weeklyTpl = document.querySelector('#tpl-option-weekly'),
        monthlyTpl = document.querySelector('#tpl-option-monthly');

    if(frequency === 'weekly') {
        optionsContainer.innerHTML = weeklyTpl.innerHTML;
    } else if(frequency === 'monthly') {
        optionsContainer.innerHTML = monthlyTpl.innerHTML;
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
            item = findInObject(lists.parameters.items, 'ref', dataItem.ref),
            dataModel = {
                item: item,
                data: dataItem
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
            "repeat": 1,
            "startDate": "2014-12-20",
            "endDate": "2014-12-20",
            "when": [{
                "days": [1,3]
            }]
        },{
            "category": "General",
            "ref": "APS",
            "frequency": "weekly",
            "repeat": 1,
            "startDate": "2014-12-20",
            "endDate": "2014-12-20",
            "when": [{
                "days": [1,3]
            }]
        }]

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
    document.querySelector("#editModal").hide();
}


function showModal() {
    document.querySelector("#editModal").show();
}