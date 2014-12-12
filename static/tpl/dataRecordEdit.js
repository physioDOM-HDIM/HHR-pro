"use strict";

var infos = {},
    idx = 0,
    createdDataRecordID = null,
    lists = {};

infos.datasInit = null;


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

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

/* UI Actions */

function addLine(category) {
    var tpl = document.querySelector('#newItem').innerHTML,
        container = document.querySelector('#newItems-'+category),
        newLine = document.createElement('div');

    //add index to line for form2js formating
    var modelData = { idx: ++idx},
        html = Mustache.render(tpl, modelData);

    newLine.className = 'row'
    newLine.innerHTML = html;

    newLine.querySelector('#new-item-category').value = category;

    container.appendChild(newLine);
}

function removeLine(element) {
    var line = element.parentNode.parentNode,
        container = line.parentNode;

    container.removeChild(line);
}

function removeItem(id) {
    var item = document.querySelector('#ID'+id),
        container = item.parentNode;

    container.removeChild(item);
}

/* Form Valid */
function update(dataRecordID) {
    var obj = form2js(document.forms.dataRecord);

    if(JSON.stringify(obj) !== "{}") {

        var i=0,
        data = obj.items,
        len = data.length,
        origin = infos.datasInit.items;

        for(i; i<len; i++) {
            //Bool and float convertion
            data[i].value = parseFloat(data[i].value);
            data[i].automatic = (data[i].automatic === "true");

            if(origin) {
                origin[i].value = parseFloat(origin[i].value);
                origin[i].automatic = (origin[i].automatic === "true");

                //check if change has been done, if so set automatic field to false
                if(origin[i].value !== data[i].value || origin[i].text !== data[i].text) {
                    data[i].automatic = false;
                }
            }

        }

        console.log("res", data);
        promiseXHR("PUT", "/api/beneficiary/datarecords/"+dataRecordID, 200, JSON.stringify(data)).then(function(response) {
            updateSuccess();
        }, function(error) {
            errorOccured();
            console.log("saveForm - error: ", error);
        });

    } else {
        errorOccured();
    }
}

function create() {

    if(createdDataRecordID !== null) {
        update(createdDataRecordID);
    } else {
        var obj = form2js(document.forms.dataRecord);

        if(JSON.stringify(obj) !== "{}") {

            var i=0,
            len = obj.items.length;

            for(i; i<len; i++) {
                //Bool and float convertion
                obj.items[i].value = parseFloat(obj.items[i].value);
                obj.items[i].automatic = false;
            }

            console.log("res", obj);
            promiseXHR("POST", "/api/beneficiary/datarecord", 200, JSON.stringify(obj)).then(function(response) {
                createSuccess();
                var record = JSON.parse(response);
                createdDataRecordID = record._id;
            }, function(error) {
                errorOccured();
                console.log("saveForm - error: ", error);
            });

        } else {
            errorOccured();
        }
    }

}

window.addEventListener("DOMContentLoaded", function() {
    infos.datasInit = form2js(document.forms.dataRecord);
    infos.lang = document.querySelector('#lang').innerText;
    getLists();
}, false);


function getLists() {

    var promises = {
            parameters: promiseXHR("GET", "/api/lists/parameters", 200),
            symptom: promiseXHR("GET", "/api/lists/symptom", 200),
            questionnaire: promiseXHR("GET", "/api/lists/questionnaire", 200),
            unity: promiseXHR("GET", "/api/lists/unity", 200)
        };

    RSVP.hash(promises).then(function(results) {

        lists.parameters = JSON.parse(results.parameters);
        lists.symptom = JSON.parse(results.symptom);
        lists.questionnaire = JSON.parse(results.questionnaire);

        var unityList = JSON.parse(results.unity);

        var i = 0,
            leni = lists.parameters.items.length;

        for(i; i<leni; i++) {
            var y = 0,
                leny = unityList.items.length;

            for(y; y<leny; y++) {
                if(lists.parameters.items[i].unity === unityList.items[y].ref) {
                    lists.parameters.items[i].unityLabel = unityList.items[y].label[infos.lang];
                    break;
                }
            }
        }

        setLang();
        initParams();

    });

}

function setLang() {

    var i = 0,
        len = lists.parameters.items.length;

    for(i; i<len; i++) {
        lists.parameters.items[i].labelLang = lists.parameters.items[i].label[infos.lang];
    }

}

function initParams() {
    var lines = document.querySelectorAll('.line'),
        i = 0,
        len = lines.length;

    var selectParamTpl = document.querySelector('#selectParam').innerHTML;

    for(i; i<len; i++) {
        console.log(lines[i]);

        var type = lines[i].querySelector('.type').innerText,
            item = findInObject(lists.parameters.items, 'ref', type),
            modelDataSelect = {
                lists: lists,
                selection: function () {
                    return function(val, render) {
                        if(item.ref === render(val)) {
                            return 'selected';
                        }
                    }
                }
            },
            modelDataLine = {item: item};

        var selectHTML = Mustache.render(selectParamTpl, modelDataSelect),
            lineHTML = Mustache.render(lines[i].innerHTML, modelDataLine);


        lines[i].innerHTML = lineHTML;
        lines[i].querySelector('.item-text').innerHTML = selectHTML;
    }
}

var updateParam = function(element) {
    var minContainer = element.parentNode.parentNode.querySelector('.min-treshold'),
        maxContainer = element.parentNode.parentNode.querySelector('.max-treshold'),
        unityContainer = element.parentNode.parentNode.querySelector('.unity');

    if(element.value !== undefined && element.value !== '') {

        var param = findInObject(lists.parameters.items, 'ref', element.value);

        minContainer.innerText = param.threshold.min? param.threshold.min: '-';
        maxContainer.innerText = param.threshold.max? param.threshold.max: '-';
        unityContainer.innerText = param.unityLabel? param.unityLabel: '';

    } else {
        minContainer.innerText = '-';
        maxContainer.innerText = '-';
        unityContainer.innerText = '';
    }
}

function toggleEditMode(id) {
    var line = document.querySelector('#ID' + id),
        updateMode = line.querySelector('.updateMode'),
        readMode = line.querySelector('.readMode');

    if (hasClass(updateMode, 'hidden')) {
        updateMode.className = 'updateMode';
        readMode.className = 'readMode hidden';
    } else {
        updateMode.className = 'updateMode hidden';
        readMode.className = 'readMode';
    }
}










/* Modal */

function closeModal() {
    console.log("closeModal", arguments);
    document.querySelector("#statusModal").hide();

    var elt = document.querySelector("#statusModal"),
        subElt, child;
    subElt = elt.querySelector(".modalTitleContainer");
    subElt.innerHTML = "";
    subElt.classList.add("hidden");
    subElt = elt.querySelector(".modalContentContainer");
    subElt.innerHTML = "";
    subElt.classList.add("hidden");
    subElt = elt.querySelector(".modalButtonContainer");
    for (var i = subElt.childNodes.length - 1; i >= 0; i--) {
        child = subElt.childNodes[i];
        subElt.removeChild(child);
    }
    subElt.classList.add("hidden");
}

function showModal(modalObj) {
    console.log("showModal", arguments);

    var elt = document.querySelector("#statusModal"),
        subElt;
    if (modalObj.title) {
        subElt = elt.querySelector(".modalTitleContainer");
        subElt.innerHTML = document.querySelector("#" + modalObj.title).innerHTML;
        subElt.classList.remove("hidden");
    }
    if (modalObj.content) {
        subElt = elt.querySelector(".modalContentContainer");
        subElt.innerHTML = document.querySelector("#" + modalObj.content).innerHTML;
        subElt.classList.remove("hidden");
    }

    if (modalObj.buttons) {
        var btn, obj, color;
        subElt = elt.querySelector(".modalButtonContainer");
        for (var i = 0; i < modalObj.buttons.length; i++) {
            obj = modalObj.buttons[i];
            btn = document.createElement("button");
            btn.innerHTML = document.querySelector("#" + obj.id).innerHTML;
            btn.onclick = obj.action;
            switch (obj.id) {
                case "trad_ok":
                    {
                        color = "green";
                    }
                    break;
                case "trad_yes":
                    {
                        color = "green";
                    }
                    break;
                case "trad_no":
                    {
                        color = "blue";
                    }
                    break;
            }
            btn.classList.add(color);
            subElt.appendChild(btn);
        }
        subElt.classList.remove("hidden");
    }

    document.querySelector("#statusModal").show();
}

function confirmDeleteItem(id) {
    var modalObj = {
        title: "trad_delete",
        content: "trad_confirm_delete",
        buttons: [{
            id: "trad_yes",
            action: function() {
                removeItem(id);
                closeModal();
            }
        }, {
            id: "trad_no",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}

function errorOccured() {
    var modalObj = {
        title: "trad_error",
        content: "trad_error_occured",
        buttons: [{
            id: "trad_ok",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}

function createSuccess() {
    var modalObj = {
        title: "trad_create",
        content: "trad_success_create",
        buttons: [{
            id: "trad_ok",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}

function updateSuccess() {
    var modalObj = {
        title: "trad_update",
        content: "trad_success_update",
        buttons: [{
            id: "trad_ok",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}
