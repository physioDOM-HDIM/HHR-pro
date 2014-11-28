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

function checkForm(form) {
    console.log("checkForm", arguments);

    var form = document.querySelector("form[name=items]");
    var modalObj;
    //check the ref value not already exists
    if (valueExists(form.getAttribute("name"))) {
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
        }, {
            id: "trad_no",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
    return true;
}

function save() {
    console.log("save");
    update();
    
    newItems.forEach( function(item, i) {
        if( item.ref ) {
            delete item.new;
            delete item.units;
            list.items.push( item );
        }
    });
    
    newItems = [];
    
    var modalObj;
    promiseXHR("PUT", "/api/lists/" + list.name, 200, JSON.stringify(list)).then(function(response) {
        modalObj = {
            title: "trad_success",
            content: "trad_success_update",
            buttons: [{
                id: "trad_ok",
                action: function() {
                    showLang();
                    closeModal();
                }
            }]
        };
        showModal(modalObj);
    }, function(error) {
        modalObj = {
            title: "trad_error",
            content: "trad_error_occured",
            buttons: [{
                id: "trad_ok",
                action: function() {
                    showLang();
                    closeModal();
                }
            }]
        };
        showModal(modalObj);
        console.log("updateItem - error: ", error);
    });
}

function deleteItem(node) {
    console.log("deleteItem", arguments);
    var form;
    while (!node.classList.contains("itemContainer")) {
        node = node.parentNode;
    }
    form = node.parentNode;
    form.removeChild(node);

    refreshDefaultValue(form.getAttribute("name"));
}

function valueExists(formName) {
    console.log("valueExists", arguments);
    var res = false,
        values = [],
        items = document.querySelectorAll("form[name='" + formName + "'] input[name*='].ref']");
    [].map.call(items, function(item) {
        if (values.indexOf(item.value) !== -1) {
            res = true;
        } else {
            values.push(item.value);
        }
    });

    return res;
}

function refreshDefaultValue(formName) {
    console.log("refreshDefaultValue", arguments);
    var select = document.querySelector("form[name='" + formName + "'] select[name='defaultValue']"),
        selectedItemValue = select.options[select.selectedIndex].value;
    //Don't delete the first item ('no default value')
    for (var i = select.children.length - 1; i > 0; i--) {
        select.removeChild(select.children[i]);
    }

    var elt,
        items = document.querySelectorAll("form[name='" + formName + "'] input[name*='].ref']");
    [].map.call(items, function(item) {
        elt = document.createElement("option");
        elt.value = item.value;
        //Select the previous selected item
        if (item.value === selectedItemValue) {
            elt.setAttribute("selected", "true");
        }
        elt.innerHTML = elt.value;
        select.appendChild(elt);
    });
}

function addItem(node) {
    console.log("addItem");
    var cn = "hidden",
        isMeasurableItem = false,
        form = node,
        name, tpl, html,
        modelData, obj, newItem;

    var lang = document.querySelector("#lang").value;
    var indx = newItems.length + list.items.length;
    newItem = { ref:"", label:{}, new:true };
    
    modelData = {
        editable: true,
        lang    : lang,
        items   : []
    };
    
    if(list.measure){
        tpl = document.querySelector("#tplItemsMeasure").innerHTML;
        
        obj = {
            idx: indx, 
            new:true, 
            ref:"", 
            label:"",
            "unity": "",
            "autoInput": false,
            "threshold": {
                "min": null,
                "max": null
            },
            "range": {
                "min": null,
                "max": null
            },
            units:[]
        };
        units.items.forEach( function(unit) {
            var option = { 
                value: unit.ref, 
                label: unit.label[lang] || unit.label.en,
                selected:false
            };
            obj.units.push(option);
        });
        modelData.items.push(obj);
    }
    else{
        tpl = document.querySelector("#tplItems").innerHTML;
        obj = {
                idx: indx,
                new:true,
                ref:"",
                label: ""
        };
        modelData.items.push(obj);
    }
    newItem = JSON.parse(JSON.stringify(obj));
    delete newItem.idx;
    newItem.label = {};
    newItems.push( newItem );
    if( list.service ) { 
        modelData.service = true; 
        modelData.items[0].roles = "[]";
        modelData.items[0].roleTypeCode = "";
    }
    html = Mustache.render(tpl, modelData);
    var div = document.createElement("div");
    div.innerHTML = html;
    div = div.querySelector("div");
    document.getElementById("newItems").appendChild(div);
    // div.scrollIntoView();
}

function edit(node) {
    console.log("edit", arguments);

    var formName,
        form = node;
    while (form.tagName.toLowerCase() !== "form" && form.tagName.toLowerCase() !== "body") {
        form = form.parentNode;
    }
    formName = form.getAttribute("name");

    var items = document.querySelectorAll("form[name='" + formName + "'] *[name]");
    [].map.call(items, function(item) {
        //Don't disable the checkbox
        if (item.getAttribute("name") !== "editable") {
            if (node.checked) {
                item.removeAttribute("disabled");
            } else {
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
