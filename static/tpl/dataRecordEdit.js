window.addEventListener("DOMContentLoaded", function() {
    var elt = document.querySelector("#datetime").innerText,
        modelData = {
            dateFormat: function() {
                return function(val, render) {
                    console.log(render(val))
                    return moment.utc(render(val)).format("YYYY-MM-DD | HH:mm") + ' ';
                }
            }
        };

     document.querySelector("#datetime").innerText = Mustache.render(elt, modelData);
}, false);

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

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

function toggleEditMode(id) {
    var line = document.querySelector('#ID' + id),
        updateMode = line.querySelector('.updateMode'),
        readMode = line.querySelector('.readMode');

    if (hasClass(updateMode, 'hidden')) {
        updateMode.className = "updateMode";
        readMode.className = "readMode hidden";
    } else {
        updateMode.className = "updateMode hidden";
        readMode.className = "readMode";
    }
}

function toggleEditMode(id) {
    var line = document.querySelector('#ID' + id),
        updateMode = line.querySelector('.updateMode'),
        readMode = line.querySelector('.readMode');

    if (hasClass(updateMode, 'hidden')) {
        updateMode.className = "updateMode";
        readMode.className = "readMode hidden";
    } else {
        updateMode.className = "updateMode hidden";
        readMode.className = "readMode";
    }
}

function toggleAddMode(category) {
    var line = document.querySelector('#add' + category),
        addModeOn = line.querySelector('.addModeOn'),
        addModeOff = line.querySelector('.addModeOff');

    if (hasClass(addModeOn, 'hidden')) {
        addModeOn.className = "addModeOn";
        addModeOff.className = "addModeOff hidden";
    } else {
        addModeOn.className = "addModeOn hidden";
        addModeOff.className = "addModeOff";
    }
}


function updateMode(id) {
    toggleEditMode(id);
}

function addMode(category) {
    toggleAddMode(category);
}


function updateMinMax(obj) {
    console.log("updateDataRecordItems", obj);
    //TODO When data model for min max threshold is written
}

function updateItem(id) {
    //TODO Update Logic for item
    //then end with: 
    toggleEditMode(id);
}

function addItem(category) {
    //TODO Add Logic for new Item
    //then end with: 
    toggleAddMode(category);
}