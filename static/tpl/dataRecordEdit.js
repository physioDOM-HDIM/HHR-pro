"use strict";

var dataAPI = {};

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


/* UI Actions */
function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function toggleEditMode(id) {
    var line = document.querySelector('#ID' + id),
        updateMode = line.querySelector('.updateMode'),
        readMode = line.querySelector('.readMode');

    //reset values of form input/select
    var thresholdField = updateMode.querySelector('select'),
        valueField = updateMode.querySelector('input'),
        thresholdSaved = readMode.querySelector('.item-text'),
        valueSaved = readMode.querySelector('.item-value');

    thresholdField.value = thresholdSaved.innerText;
    valueField.value = valueSaved.innerText;
    updateThreshold(thresholdField);

    if (hasClass(updateMode, 'hidden')) {
        updateMode.className = 'updateMode';
        readMode.className = 'readMode hidden';
    } else {
        updateMode.className = 'updateMode hidden';
        readMode.className = 'readMode';
    }
}

function addLine(category) {
    var tpl = document.querySelector('#newItem').innerHTML,
        container = document.querySelector('#newItems-'+category),
        newLine = document.createElement('div');

    newLine.className = 'row'
    newLine.innerHTML = tpl;

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

/* Thresholds params */

var updateThreshold = function(element) {

    if(element.value !== undefined && element.value !== '') {
        var value = element.value;
    } else {
        var value = 'no-choice';
    }

    var choice = document.querySelector('#thresholdListValue').querySelector('#'+value),
        min = choice.querySelector('#min').innerText,
        max = choice.querySelector('#max').innerText,
        minContainer = element.parentNode.parentNode.querySelector('.min-treshold'),
        maxContainer = element.parentNode.parentNode.querySelector('.max-treshold');

    minContainer.innerText = min;
    maxContainer.innerText = max;
}

/* Form Valid (TODO) */

function updateMinMax(obj) {
    console.log("updateDataRecordItems", obj);
    //TODO When data model for min max threshold is written
}

function save() {
    //TODO
    window.alert('afficher modal confirmation puis envoyer données');
}

window.addEventListener("DOMContentLoaded", function() {

}, false);