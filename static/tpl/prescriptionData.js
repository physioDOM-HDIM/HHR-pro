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

var initParams = function() {
    var dataList = document.querySelectorAll('.data-item'),
        i = 0,
        len = dataList.length;

    for(i; i<len; i++) {
        var dataItem = dataList[i],
            dataRef = dataItem.querySelector('.data-ref').innerText,
            item = findInObject(lists.parameters.items, 'ref', dataRef),
            dataModel = {
                item: item
            };

            console.log(item);

        dataItem.innerHTML = Mustache.render(dataItem.innerHTML, dataModel);
    }
};

var getList = function() {
    var promises = {
            parameterList: promiseXHR("GET", "/api/lists/"+infos.category, 200)
        };

    RSVP.hash(promises).then(function(results) {

        lists.parameters = JSON.parse(results.parameterList);

        var i = 0,
        leni = lists.parameters.items.length;

        for(i; i<leni; i++) {
            lists.parameters.items[i].labelLang = lists.parameters.items[i].label[infos.lang];
        }

        initParams();

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