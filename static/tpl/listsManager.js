"use strict";

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

function checkForm(){
    console.log("checkForm");

}

function addItem(node){
    console.log("addItem");
    var elt = document.querySelector("#tplItemContainer").innerHTML;
    var modelData = {
        idx: new Date().getTime()
    };
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("itemContainer");
    div.innerHTML = html;
    node.parentNode.parentNode.insertBefore(div, node.parentNode);
}

function addList(node){
    console.log("addList");
    
    //TODO
    /*var elt = document.querySelector("#tplListContainer").innerHTML;
    var modelData = {
        idx: new Date().getTime()
    };
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("listContainer");
    div.innerHTML = html;
    node.parentNode.parentNode.insertBefore(div, node.parentNode);*/
}

function init() {
    console.log("init");

}

window.addEventListener("DOMContentLoaded", init, false);
