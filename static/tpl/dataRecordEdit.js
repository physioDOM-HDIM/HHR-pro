"use strict";

window.addEventListener("DOMContentLoaded", function() {
    var elt = document.querySelector("#datetime").innerText,
        modelData = {
            dateFormat: function() {
                return function(val, render) {
                    return moment.utc(render(val)).format("YYYY-MM-DD | HH:mm") + ' ';
                };
            }
        };

     document.querySelector("#datetime").innerText = Mustache.render(elt, modelData);
}, false);


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
        container = document.querySelector('#newItems-'+category);

    container.innerHTML += tpl;
}

function removeLine(element) {
    var line = element.parentNode.parentNode,
        container = line.parentNode;

    container.removeChild(line);
}


/* Form Valid (TODO) */
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

function updateMinMax(obj) {
    console.log("updateDataRecordItems", obj);
    //TODO When data model for min max threshold is written
}

function save() {
    //TODO
    window.alert('afficher modal confirmation puis envoyer données');
}