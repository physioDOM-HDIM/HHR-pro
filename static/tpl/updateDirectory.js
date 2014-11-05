"use strict";

var itemObj = {},
    telecomItemClassname = "telecomContainer",
    _tmpUseEnum = ["", "home", "work", "temp", "old"],
    _tmpSystemEnum = ["", "phone", "mobile", "email"],
    _tmpRoleEnum = ["", "administrator", "coordinator", "physician", "medical", "social"],
    _tmpJobEnum = ["", "system administrator", "coordinator", "physician", "pharmacist", "Physician assistant", "dietitian", "therapist", "paramedic", "nurse", "professional home carer", "social worker"],
    _tmpCommunicationEnum = ["", "fr", "es", "nl", "en"];

//Filter to join an array with specific string
// PolymerExpressions.prototype.join = function(array, str) {
//     return array && array.join(str || "");
// };

function getQueryVariable(variable) {
    console.log("getQueryVariable", arguments);
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return (false);
}

function deleteTelecom( /*node*/ idx) {
    console.log("deleteTelecom", arguments);
    itemObj.telecom.splice(idx, 1);
    /*var found = false;

    node = node.parentNode;
    while (!found && node) {
        if (node.className && node.className.toLowerCase() === telecomItemClassname.toLowerCase()) {
            found = true;
            document.querySelector("#telecomFieldset").removeChild(node);
        } else {
            node = node.parentNode;
        }
    }*/
}

function addTelecom( /*buttonNode*/ ) {
    console.log("addTelecom", arguments);
    if (!(itemObj.telecom instanceof Array)) {
        itemObj.telecom = [];
    }
    itemObj.telecom.push({
        use: "",
        system: "",
        value: ""
    });

    //TODO : requete pour demander le template à insérer?
    // var div = document.createElement("div"),
    //     elt, elt2;
    // div.className = telecomItemClassname;

    // elt = document.createElement("label");
    // elt.innerHTML = "Use:";
    // div.appendChild(elt);
    // elt = document.createElement("select");
    // elt.className = "telecomUse";
    // elt2 = document.createElement("option");
    // elt2.setAttribute("value", "todo1");
    // elt2.innerHTML = "TODO";
    // elt.appendChild(elt2);
    // div.appendChild(elt);

    // elt = document.createElement("label");
    // elt.innerHTML = "System:";
    // div.appendChild(elt);
    // elt = document.createElement("select");
    // elt.className = "telecomSystem";
    // elt2 = document.createElement("option");
    // elt2.setAttribute("value", "todo1");
    // elt2.innerHTML = "TODO";
    // elt.appendChild(elt2);
    // div.appendChild(elt);

    // elt = document.createElement("label");
    // elt.innerHTML = "Value:";
    // div.appendChild(elt);
    // elt = document.createElement("tsante-inputtext");
    // elt.className = "telecomValue";
    // div.appendChild(elt);

    // elt = document.createElement("button");
    // elt.innerHTML = "delete";
    // elt.onclick = function(e) {
    //     deleteTelecom(e.target);
    // };
    // div.appendChild(elt);

    //document.querySelector("#telecomFieldset").insertBefore(div, buttonNode);
}

function closeModal() {
    console.log("closeModal", arguments);
    document.querySelector("zdk-modal").hide();
}

function showModal(model) {
    console.log("showModal", arguments);
    if (model) {
        var modal = document.querySelector("zdk-modal"),
            modalTpl = modal.querySelector("template");
        modalTpl.model = model;
        modal.show();
    }
}

function deleteItem() {
    console.log("deleteItem", arguments);
    closeModal();
    if (itemObj._id) {
        var xhr = new XMLHttpRequest();
        var url = "/api/directory/" + itemObj._id;
        xhr.open("DELETE", url, true);
        xhr.onload = function() {
            var model;
            //410 for delete OK
            if (xhr.status === 410) {
                model = {
                    msg: {
                        title: "Success",
                        content: "Item deleted",
                        buttons: [{
                            label: "OK",
                            action: "closeModal(); window.history.back()"
                        }]
                    }
                };
            } else {
                model = {
                    msg: {
                        title: "Error",
                        content: "Error occurred: " + xhr.responseText,
                        buttons: [{
                            label: "OK",
                            action: "closeModal();"
                        }]
                    }
                };
            }
            showModal(model);
        };
        xhr.send();
    }
}

// Function: createNestedObject( base, names[, value] )
//   base: the object on which to create the hierarchy
//   names: an array of strings contaning the names of the objects
//   value (optional): if given, will be the last object in the hierarchy
// Returns: the last object in the hierarchy
function createNestedObject(base, names, value) {
    console.log("createNestedObject", arguments);

    if (!names) {
        return;
    }
    if (!(names instanceof Array)) {
        names = names.split(".");
    }

    // If a value is given, remove the last name and keep it for later:
    var lastName = arguments.length === 3 ? names.pop() : false;

    // Walk the hierarchy, creating new objects where needed.
    // If the lastName was removed, then the last object is not set yet:
    for (var i = 0; i < names.length; i++) {
        base = base[names[i]] = base[names[i]] || {};
    }

    // If a value was given, set it to the last name:
    if (lastName) {
        base = base[lastName] = (value === "") ? (typeof base[lastName] !== "undefined" ? base[lastName] : value) : value;
    }

    // Return the last object in the hierarchy:
    return base;
}

function updateItem() {
    console.log("updateItem", arguments);
    closeModal();

    //Ne pas envoyer les champs '' ou array vide ?
    if (itemObj.organization === true) {
        delete itemObj.name.given;
        delete itemObj.gender;
        delete itemObj.job;
    } else {
        delete itemObj.organization;
    }

    if (itemObj.address.line === "") {
        delete itemObj.address.line;
    } else if (itemObj.address.line){
        itemObj.address.line = itemObj.address.line instanceof Array ? itemObj.address.line : itemObj.address.line.split("\n");
    }

    console.log(itemObj);

    var xhr = new XMLHttpRequest(),
        successModel = {
            msg: {
                title: "Success",
                content: "Item updated",
                buttons: [{
                    label: "OK",
                    action: "closeModal(); window.history.back()"
                }]
            }
        },
        errorModel = {
            msg: {
                title: "Error",
                content: "Error occurred: ",
                buttons: [{
                    label: "OK",
                    action: "closeModal();"
                }]
            }
        },
        url = "/api/directory",
        xhrHandle = function(url, method, status, dialogModelSuccess, dialogModelError) {
            xhr.open(method, url, true);
            xhr.onload = function() {
                var model;
                if (xhr.status === status) {
                    model = dialogModelSuccess;
                } else {
                    model = dialogModelError;
                    model.msg.content += xhr.responseText;
                    console.log(xhr);
                }
                showModal(model);
            };
            xhr.send(JSON.stringify(itemObj));
        };

    if (itemObj._id) {
        //Update entry
        xhrHandle(url + "/" + itemObj._id, "PUT", 200, successModel, errorModel);
    } else {
        //Creation of entry
        successModel.msg.content = "Item created";
        xhrHandle(url, "POST", 200, successModel, errorModel);
    }


    /*
        var newItem = {},
            formElements = document.forms.directoryForm.querySelectorAll("*[name]"),
            elt, tagName;
        //Browse all form components to build the final object to send to the server
        for (var i = 0; i < formElements.length; i++) {
            elt = formElements[i];
            tagName = elt.tagName.toLowerCase();
            switch (tagName) {
                case "tsante-inputtext":
                    {
                        createNestedObject(newItem, elt.name, elt.value);
                    }
                    break;
                case "input":
                    {
                        if (elt.type === "radio" && elt.checked) {
                            createNestedObject(newItem, elt.name, elt.value);
                        } else if (elt.type === "checkbox") {
                            createNestedObject(newItem, elt.name, elt.checked);
                        }
                    }
                    break;
                case "select":
                    {
                        createNestedObject(newItem, elt.name, elt.options[elt.selectedIndex].value);
                    }
                    break;
                case "textarea":
                    {
                        createNestedObject(newItem, elt.name, elt.value.split("\n"));
                    }
                    break;
            }
        }

        //Do the telecom object manually due to template repeat and array data format
        var telecomItems = document.forms.directoryForm.querySelectorAll("#telecomFieldset .telecomContainer"),
            item, telecomSubItem, telecomObj;
        for (i = 0; i < telecomItems.length; i++) {
            item = telecomItems[i];
            telecomObj = {};
            if (i === 0) {
                newItem.item.telecom = [];
            }
            telecomSubItem = item.querySelector(".telecomUse");
            if (telecomSubItem) {
                telecomObj.use = telecomSubItem.options[telecomSubItem.selectedIndex].value;
            }
            telecomSubItem = item.querySelector(".telecomSystem");
            if (telecomSubItem) {
                telecomObj.system = telecomSubItem.options[telecomSubItem.selectedIndex].value;
            }
            telecomSubItem = item.querySelector(".telecomValue");
            if (telecomSubItem && telecomSubItem.value !== "") {
                telecomObj.value = telecomSubItem.value;
            }
            newItem.item.telecom.push(telecomObj);
        }

        if (itemObj._id) {
            //Update entry
            newItem.item._id = itemObj._id;
            var xhr = new XMLHttpRequest();
            var url = "/api/directory/" + itemObj._id;
            xhr.open("PUT", url, true);
            xhr.onload = function() {
                var model;
                if (xhr.status === 200) {
                    model = {
                        msg: {
                            title: "Success",
                            content: "Item updated",
                            buttons: [{
                                label: "OK",
                                action: "closeModal(); window.history.back()"
                            }]
                        }
                    };
                } else {
                    model = {
                        msg: {
                            title: "Error",
                            content: "Error occurred: " + xhr.responseText,
                            buttons: [{
                                label: "OK",
                                action: "closeModal();"
                            }]
                        }
                    };
                }
                showModal(model);
            };
            xhr.send(JSON.stringify(newItem.item));
        } else {
            //Creation of entry
            var xhr = new XMLHttpRequest();
            var url = "/api/directory";
            xhr.open("POST", url, true);
            xhr.onload = function() {
                var model;
                if (xhr.status === 200) {
                    model = {
                        msg: {
                            title: "Success",
                            content: "Item created",
                            buttons: [{
                                label: "OK",
                                action: "closeModal(); window.history.back()"
                            }]
                        }
                    };
                } else {
                    model = {
                        msg: {
                            title: "Error",
                            content: "Error occurred: " + xhr.responseText,
                            buttons: [{
                                label: "OK",
                                action: "closeModal();"
                            }]
                        }
                    };
                }
                showModal(model);
            };
            xhr.send(JSON.stringify(newItem.item));
        }

        console.log(newItem.item);
        console.log(itemObj);*/
}

function confirm(str) {
    console.log("confirm", arguments);
    var model = {
        msg: {
            title: str.toUpperCase(),
            content: "Are you sure you want to " + str + " this item ?",
            buttons: [{
                label: "Yes",
                action: str + "Item()"
            }, {
                label: "No",
                action: "closeModal()"
            }]
        }
    };
    showModal(model);
}

function createEmptyValueForTemplateBinding() {
    console.log("createEmptyValueForTemplateBinding - itemObj", itemObj);

    var formElements = document.body.querySelectorAll("*[name]"),
        elt, eltName;
    for (var i = 0; i < formElements.length; i++) {
        elt = formElements[i];
        eltName = elt.name.slice(elt.name.indexOf(".") + 1); //remove the 'item.' prefixe
        createNestedObject(itemObj, eltName, "");
        // switch (elt.tagName.toLowerCase()) {
        //     case "tsante-inputtext":
        //         {
        //             createNestedObject(itemObj, eltName, "");
        //         }
        //         break;
        //     case "input":
        //         {
        //             if (elt.type === "checkbox") {
        //                 createNestedObject(itemObj, eltName, elt.checked);
        //             }
        //         }
        //         break;
        //     case "select":
        //         {
        //             createNestedObject(itemObj, eltName, "");
        //         }
        //         break;
        //     case "textarea":
        //         {
        //             createNestedObject(itemObj, eltName, "");
        //         }
        //         break;
        // }

    }
    console.log("createEmptyValueForTemplateBinding - itemObj end", itemObj);
}

function templateReady() {
    console.log("templateReady");

    var itemIdParam = getQueryVariable("itemId"),
        initModel = function() {
            createEmptyValueForTemplateBinding();
            //Fill Combobox
            document.querySelector("#tplInfoContainer").model = {
                item: itemObj,
                enums: {
                    enumUse: _tmpUseEnum,
                    enumSystem: _tmpSystemEnum,
                    enumRole: _tmpRoleEnum,
                    enumJob: _tmpJobEnum,
                    enumCommunication: _tmpCommunicationEnum
                }
            };
        };
    console.log("templateReady - itemIdParam", itemIdParam);

    if (itemIdParam) {
        //edit mode
        var coreAjaxElt = document.querySelector("core-ajax");

        coreAjaxElt.addEventListener("core-response", function(e) {
            console.log("core-response", arguments);
            itemObj = e.detail.response;

            //Due to FF limitation for filtering expression (PolymerExpressions undefined)
            //format the address.line data joinning the array with '/n' to display it in textarea
            var address = itemObj.address;
            if (address && address.line) {
                address.line = address.line.join("\n");
            }

            initModel();
        });

        coreAjaxElt.url += itemIdParam;
        coreAjaxElt.go();
    } else {
        //creation mode
        initModel();
    }

}

function init() {
    //TODO internationalization
    console.log("init");
    document.querySelector("#tplInfoContainer").addEventListener("template-bound", templateReady, false);
}

window.addEventListener("polymer-ready", init, false);
