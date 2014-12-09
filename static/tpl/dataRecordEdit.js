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


/* UI Actions */
function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
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