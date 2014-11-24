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

function checkForm(form){
    console.log("checkForm", arguments);

    var modalObj;
    //check the ref value not already exists
    if(valueExists(form.getAttribute("name"))){
        modalObj = {
                    title: "trad_error",
                    content: "trad_error_ref",
                    buttons: [{
                        id: "trad_ok",
                        action: function() {
                            closeModal();
                        }
                    }]
                };
        showModal(modalObj);
        return false;
    }

    modalObj = {
                title: "trad_save",
                content: "trad_confirm_save",
                buttons: [{
                    id: "trad_yes",
                    action: function() {
                        updateForm(form);
                        closeModal();
                    }
                },
                {
                    id: "trad_no",
                    action: function() {
                        closeModal();
                    }
                }]
            };
    showModal(modalObj);
    return true;
}

function updateForm(form){
    console.log("updateForm", arguments)
    //Delete disabled attribute on inputs ref before asking for form2js, ifnot disabled values doesn't set
    var obj, elt,
        formName = form.getAttribute("name"),
        items = document.querySelectorAll("form[name='"+formName+"'] *[name]"),
        isDisabled = false;

    [].map.call(items, function(item){
        if(item.getAttribute("disabled") !== null){
            isDisabled = true;
            item.removeAttribute("disabled");
        }
    });

    //Don't skip empty values
    obj = form2js(form, ".", false);

    if(isDisabled){
        //Add disabled attribute on inputs ref
        [].map.call(items, function(item){
            item.setAttribute("disabled", true);
        });
    }

    //Refresh select default value
    refreshDefaultValue(formName);

    //Remove add/delete item buttons
    items = document.querySelectorAll("form[name='"+formName+"'] .itemBtnContainer");
    [].map.call(items, function(item){
        for(var i=item.children.length - 1; i>=0; i--){
            item.removeChild(item.children[i]);
        }
    });

    if(isDisabled){
        elt = document.querySelector("form[name='"+formName+"'] .mainBtnContainer");
        elt.parentNode.removeChild(elt);

        //TODO: doesn't work
        form.parentNode.setAttribute("bgcolor", "silver");
    }

    console.log("obj", obj);
    //TODO
}

function deleteItem(node){
    console.log("deleteItem", arguments);
    var form;
    while(!node.classList.contains("itemContainer")){
        node = node.parentNode;
    }
    form = node.parentNode;
    form.removeChild(node);

    refreshDefaultValue(form.getAttribute("name"));
}

function valueExists(formName){
    console.log("valueExists", arguments);
    var res = false, values = [],
        items = document.querySelectorAll("form[name='"+formName+"'] input[name*='].ref']");
    [].map.call(items, function(item){
        if(values.indexOf(item.value) !== -1){
            res = true;
        }
        else{
            values.push(item.value);
        }
    });

    return res;
}

function refreshDefaultValue(formName){
    console.log("refreshDefaultValue", arguments);
    var select = document.querySelector("form[name='"+formName+"'] select[name='defaultValue']"),
        selectedItemValue = select.options[select.selectedIndex].value;
    //Don't delete the first item ('no default value')
    for(var i=select.children.length - 1; i>0; i--){
        select.removeChild(select.children[i]);
    }

    var elt,
        items = document.querySelectorAll("form[name='"+formName+"'] input[name*='].ref']");
    [].map.call(items, function(item){
        elt = document.createElement("option");
        elt.value = item.value;
        //Select the previous selected item
        if(item.value === selectedItemValue){
            elt.setAttribute("selected", "true");
        }
        elt.innerHTML = elt.value;
        select.appendChild(elt);
    });
}

function addItem(node){
    console.log("addItem");
    var name,
        form = node;
    //Set this new value in the default value <select>
    while(form.tagName.toLowerCase() !== "form" && form.tagName.toLowerCase() !== "body"){
        form = form.parentNode;
    }
    name = form.getAttribute("name");

    var elt = document.querySelector("#tplItemContainer").innerHTML;
    var modelData = {
        idx: new Date().getTime(),
        listName: name
    };
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("itemContainer");
    div.innerHTML = html;
    while(!node.classList.contains("row") && !node.classList.contains("control")){
        node = node.parentNode;
    }
    node.parentNode.insertBefore(div, node);
}

function edit(node){
    console.log("edit", arguments);

    var formName,
        form = node;
    while(form.tagName.toLowerCase() !== "form" && form.tagName.toLowerCase() !== "body"){
        form = form.parentNode;
    }
    formName = form.getAttribute("name");

    var items = document.querySelectorAll("form[name='"+formName+"'] *[name]");
    [].map.call(items, function(item){
        //Don't disable the checkbox
        if(item.getAttribute("name") !== "editable"){
            if(node.checked){
                item.removeAttribute("disabled");
            }
            else{
                item.setAttribute("disabled", "true");
            }
        }
    });
}

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