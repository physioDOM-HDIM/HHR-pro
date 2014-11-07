"use strict";

var _dataObj = null,
    _useEnum = null,
    _systemEnum = null,
    _roleEnum = null,
    _jobEnum = null,
    _communicationEnum = null;

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

function closeModal() {
    console.log("closeModal", arguments);
    document.querySelector("zdk-modal").hide();
}

function showModal(idModalContent) {
    console.log("showModal", arguments);

    var elt = document.querySelectorAll("zdk-modal .modalContainer:not(.hidden)");
    var found = false;
    [].map.call(elt, function(node) {
        if (node.id !== idModalContent) {
            node.className += "hidden";
        } else {
            found = true;
        }
    });

    if (!found) {
        elt = document.querySelector("zdk-modal #" + idModalContent);
        elt.className = elt.className.replace("hidden", "");
    }

    document.querySelector("zdk-modal").show();
}

function renderPage() {
    // document.querySelector("form[name=directoryForm] input[name='name.family']").value = "toto";
    // var a = "F";
    // document.querySelector("form[name=directoryForm] input[type=radio][value="+a+"]").checked = true;

    // var select = document.querySelector("form[name=directoryForm] select[name=job]");
    // var elt = document.createElement("option");
    // select.appendChild(elt);
    // elt = document.createElement("option");
    // elt.setAttribute("value", "job1");
    // elt.innerHTML = "job1";
    // select.appendChild(elt);
    // elt = document.createElement("option");
    // elt.setAttribute("value", "job2");
    // elt.innerHTML = "job2";
    // select.appendChild(elt);
    // select.value = "job1";
    console.log("renderPage");

    //Format the address.line (array) to display it in textarea with '\n'
    if (_dataObj) {
        var address = _dataObj.address;
        if (address && address.line) {
            address.line = address.line.join("\n");
        }
    } else {
        //Hide the delete button
        document.querySelector("#deleteItem").className += "hidden";
    }

    var idx = 0;
    var modelData = {
        item: _dataObj,
        idx: function() {
            idx++;
        },
        resetIdx: function() {
            idx = 0;
        },
        gender_m_checked: function() {
            return _dataObj && _dataObj.gender === "M" ? "checked" : "";
        },
        gender_f_checked: function() {
            return _dataObj && _dataObj.gender === "F" ? "checked" : "";
        },
        job_list: _jobEnum,
        job_selected: function() {
            return _dataObj && _dataObj.job === this ? "selected" : "";
        },
        role_list: _roleEnum,
        role_selected: function() {
            return _dataObj && _dataObj.role === this ? "selected" : "";
        },
        communication_list: _communicationEnum,
        communication_selected: function() {
            return _dataObj && _dataObj.communication === this ? "selected" : "";
        },
        organization_checked: function() {
            return _dataObj && _dataObj.organization ? "checked" : "";
        },
        active_checked: function() {
            return _dataObj && _dataObj.active ? "checked" : "";
        },
        use_list: _useEnum,
        telecom_use_selected: function() {
            return _dataObj && _dataObj.telecom[idx].use === this ? "selected" : "";
        },
        system_list: _systemEnum,
        telecom_system_selected: function() {
            return _dataObj && _dataObj.telecom[idx].system === this ? "selected" : "";
        },
        address_use_selected: function() {
            return _dataObj && _dataObj.address.use === this ? "selected" : "";
        },
        telecom_email_type: function() {
            if (_dataObj && _dataObj.telecom[idx].system.toLowerCase() === "email") {
                return "email";
            }
            return "text";
        }
    };
    document.forms.directoryForm.innerHTML = Mustache.render(document.forms.directoryForm.innerHTML, modelData);
    checkOrganization();
    checkDefaultGender();
}

function getEnumForSelect() {
	console.log("getEnumForSelect", arguments);
    //TODO get every enums values
    _useEnum = ["", "home", "work", "temp", "old"];
    _systemEnum = ["", "phone", "mobile", "email"];
    _roleEnum = ["", "administrator", "coordinator", "physician", "medical", "social"];
    _jobEnum = ["", "system administrator", "coordinator", "physician", "pharmacist", "Physician assistant", "dietitian", "therapist", "paramedic", "nurse", "professional home carer", "social worker"];
    _communicationEnum = ["", "fr", "es", "nl", "en"];

    renderPage();
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
        base = base[lastName] = value !== "" && typeof value !== "undefined" ? value : null;
    }

    // Return the last object in the hierarchy:
    return base;
}

function checkDefaultGender(){
	var elt,
		isGenderChecked = false;
	//Firefox fix: set default value for radio button to avoid validation form even if the node is hidden or the required attribute removed
    elt = document.querySelectorAll("form[name=directoryForm] input[name='gender']");
    [].map.call(elt, function(node, idx) {
    	if(node.checked){
    		isGenderChecked = true;
    	}
    });
    if(!isGenderChecked){
    	//Set default radio checked to avoid form validation in Firefox
    	document.querySelector("form[name=directoryForm] input[name='gender']").checked = true;
    }
}

function checkOrganization(){
	console.log("checkOrganization", arguments);
	var elt = document.querySelector("#nonOrgContainer"),
		isOrganization = document.querySelector("form[name=directoryForm] input[name='organization']").checked;

	//Show/Hide relative information to a none organization
	elt.className = isOrganization ? elt.className + " hidden" : elt.className.replace("hidden", "");
}

function checkEmailTypeValidation(node){
	console.log("checkEmailTypeValidation", arguments);
	var isEmail = node.options[node.selectedIndex].value.toLowerCase() === "email";
	node.parentNode.querySelector("input[name='telecom.value']").type = isEmail ? "email" : "text";
}

function deleteTelecom(node) {
    console.log("deleteTelecom", arguments);
    node.parentNode.parentNode.removeChild(node.parentNode);
}

function addTelecom() {
    console.log("addTelecom", arguments);
    var elt = document.querySelector("#tplTelecomContainer"),
        parentElt = elt.parentNode,
        cloneElt = elt.cloneNode(true);

    cloneElt.className = cloneElt.className.replace("hidden", "");
    parentElt.insertBefore(cloneElt, parentElt.querySelector("#addTelecomBtn"));
}

function getFormData(){
	console.log("getFormData");

	var itemObj = {},
        elt, name;

    name = "name.family";
    createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

    name = "organization";
    elt = document.querySelector("form[name=directoryForm] input[name='" + name + "']");
    if (elt.checked) {
        //Organization
        createNestedObject(itemObj, name, elt.checked);
    } else {
        //!Organization
        name = "name.given";
        createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

        name = "gender";
        elt = document.querySelectorAll("form[name=directoryForm] input[name='" + name + "']");
        [].map.call(elt, function(node) {
            if (node.checked) {
                createNestedObject(itemObj, name, node.value);
            }
        });

        name = "job";
        elt = document.querySelector("form[name=directoryForm] select[name='" + name + "']");
        createNestedObject(itemObj, name, elt.options[elt.selectedIndex].value);
    }

    name = "role";
    elt = document.querySelector("form[name=directoryForm] select[name='" + name + "']");
    createNestedObject(itemObj, name, elt.options[elt.selectedIndex].value);

    name = "communication";
    elt = document.querySelector("form[name=directoryForm] select[name='" + name + "']");
    createNestedObject(itemObj, name, elt.options[elt.selectedIndex].value);

    name = "active";
    elt = document.querySelector("form[name=directoryForm] input[name='" + name + "']");
    createNestedObject(itemObj, name, elt.checked);

    //telecom
    elt = document.querySelectorAll("form[name=directoryForm] .telecomContainer:not(.hidden)");
    var subElt, value;
    [].map.call(elt, function(node, idx) {
    	if(idx === 0){
    		itemObj.telecom = [];
    	}
    	itemObj.telecom.push({});
    	name = "telecom.use";
        subElt = node.querySelector("select[name='" + name + "']");
        value = subElt.options[subElt.selectedIndex].value;
		itemObj.telecom[idx].use = value !== "" ? value : null;
		name = "telecom.system";
        subElt = node.querySelector("select[name='" + name + "']");
        value = subElt.options[subElt.selectedIndex].value;
		itemObj.telecom[idx].system = value !== "" ? value : null;
		name = "telecom.value";
        subElt = node.querySelector("input[name='" + name + "']");
        value = subElt.value;
		itemObj.telecom[idx].value = value !== "" ? value : null;
    });

    name = "address.use";
    elt = document.querySelector("form[name=directoryForm] select[name='" + name + "']");
    createNestedObject(itemObj, name, elt.options[elt.selectedIndex].value);

    name = "address.text";
    createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

    name = "address.line";
    elt = document.querySelector("form[name=directoryForm] textarea[name='" + name + "']");
    if (elt.value !== "") {
        createNestedObject(itemObj, name, elt.value.split("\n"));
    }

    name = "address.city";
    createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

    name = "address.state";
    createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

    name = "address.zip";
    createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

    name = "address.country";
    createNestedObject(itemObj, name, document.querySelector("form[name=directoryForm] input[name='" + name + "']").value);

    console.log("getFormData - result: ", itemObj);
    return itemObj;
}

function updateItem() {
    console.log("updateItem");
    // console.log(document.querySelector("form[name=directoryForm] input[name='name.family']").value);

    // var input = document.querySelectorAll("form[name=directoryForm] input[type=radio]");
    // [].map.call(input, function(node){
    // 	if (node.checked){
    // 		console.log(node.value);
    // 	}
    // });
    // //console.log(document.querySelectorAll("form[name=directoryForm] input[type=radio]").value);
    // var select = document.querySelector("form[name=directoryForm] select[name=job]");
    // console.log(select.options[select.selectedIndex].value);
    // var elements = document.querySelectorAll("form[name=directoryForm] *[name]"),
    // 	elt, itemObj = {};
    // for(var i=0; i<elements.length; i++){
    // 	elt = elements[i];
    // 	switch(elt.tagName.toLowerCase()){
    // 		case "input":{
    // 			switch(elt.type.toLowerCase()){
    // 				case "radio":{
    // 					if(elt.checked){
    // 						createNestedObject(itemObj, elt.name, elt.value);
    // 					}
    // 				} break;

    // 				case "checkbox":{
    // 					createNestedObject(itemObj, elt.name, elt.checked);
    // 				} break;

    // 				case "text":{

    // 				} break;
    // 			}
    // 		}break;
    // 		case "select":{

    // 		} break;
    // 	}
    // 	console.log(elt, elt.value);
    // }
    // console.log("OBJ", itemObj);

    closeModal();
    var data = getFormData(),
    	xhr = new XMLHttpRequest(),
        url = "/api/directory",
        xhrHandle = function(url, method, status, idModalSuccess, idModalError) {
            xhr.open(method, url, true);
            xhr.onload = function() {
                var idModal;
                if (xhr.status === status) {
                    idModal = idModalSuccess;
                } else {
                    idModal = idModalError;
                    console.log("updateItem - error: ", xhr);
                }
                showModal(idModal);
            };
            xhr.send(JSON.stringify(data));
        };

    if (data._id) {
        //Update entry
        xhrHandle(url + "/" + data._id, "PUT", 200, "modalUpdateSuccess", "modalError");
    } else {
        //Creation of entry
        xhrHandle(url, "POST", 200, "modalCreateSuccess", "modalError");
    }
}

function deleteItem() {
    console.log("deleteItem", arguments);
    closeModal();
    if (_dataObj && _dataObj._id) {
        var xhr = new XMLHttpRequest();
        var url = "/api/directory/" + _dataObj._id;
        xhr.open("DELETE", url, true);
        xhr.onload = function() {
            var modalId;
            //410 for delete OK
            if (xhr.status === 410) {
                modalId = "modalDeleteSuccess";
            } else {
            	modalId = "modalError";
                console.log("deleteItem - error: ", xhr);
            }
            showModal(modalId);
        };
        xhr.send();
    }
}

function init() {
    console.log("init");

    var itemIdParam = getQueryVariable("itemId");
    console.log("init - itemIdParam", itemIdParam);

    if (itemIdParam) {
        //edit mode
        var coreAjaxElt = document.querySelector("core-ajax");

        coreAjaxElt.addEventListener("core-response", function(e) {
            console.log("core-response", arguments);
            _dataObj = e.detail.response;
            getEnumForSelect();
        });

        coreAjaxElt.url += itemIdParam;
        coreAjaxElt.go();
    } else {
        //creation mode
        console.log("init - creation");
        getEnumForSelect();
    }
}

window.addEventListener("polymer-ready", init, false);


// function deleteTelecom( /*node*/ idx) {
//     console.log("deleteTelecom", arguments);
//     itemObj.telecom.splice(idx, 1);
// }

// function addTelecom( /*buttonNode*/ ) {
//     console.log("addTelecom", arguments);
//     if (!(itemObj.telecom instanceof Array)) {
//         itemObj.telecom = [];
//     }
//     itemObj.telecom.push({
//         use: "",
//         system: "",
//         value: ""
//     });
// }

// function closeModal() {
//     console.log("closeModal", arguments);
//     document.querySelector("zdk-modal").hide();
// }

// function showModal(model) {
//     console.log("showModal", arguments);
//     if (model) {
//         var modal = document.querySelector("zdk-modal"),
//             modalTpl = modal.querySelector("template");
//         modalTpl.model = model;
//         modal.show();
//     }
// }

// function deleteItem() {
//     console.log("deleteItem", arguments);
//     closeModal();
//     if (itemObj._id) {
//         var xhr = new XMLHttpRequest();
//         var url = "/api/directory/" + itemObj._id;
//         xhr.open("DELETE", url, true);
//         xhr.onload = function() {
//             var model;
//             //410 for delete OK
//             if (xhr.status === 410) {
//                 model = {
//                     msg: {
//                         title: "Success",
//                         content: "Item deleted",
//                         buttons: [{
//                             label: "OK",
//                             action: "closeModal(); window.history.back()"
//                         }]
//                     }
//                 };
//             } else {
//                 model = {
//                     msg: {
//                         title: "Error",
//                         content: "Error occurred: " + xhr.responseText,
//                         buttons: [{
//                             label: "OK",
//                             action: "closeModal();"
//                         }]
//                     }
//                 };
//             }
//             showModal(model);
//         };
//         xhr.send();
//     }
// }

// // Function: createNestedObject( base, names[, value] )
// //   base: the object on which to create the hierarchy
// //   names: an array of strings contaning the names of the objects
// //   value (optional): if given, will be the last object in the hierarchy
// // Returns: the last object in the hierarchy
// function createNestedObject(base, names, value) {
//     console.log("createNestedObject", arguments);

//     if (!names) {
//         return;
//     }
//     if (!(names instanceof Array)) {
//         names = names.split(".");
//     }

//     // If a value is given, remove the last name and keep it for later:
//     var lastName = arguments.length === 3 ? names.pop() : false;

//     // Walk the hierarchy, creating new objects where needed.
//     // If the lastName was removed, then the last object is not set yet:
//     for (var i = 0; i < names.length; i++) {
//         base = base[names[i]] = base[names[i]] || {};
//     }

//     // If a value was given, set it to the last name:
//     if (lastName) {
//         base = base[lastName] = (value === "" || value === null) ? (typeof base[lastName] !== "undefined" ? base[lastName] : value) : value;
//     }

//     // Return the last object in the hierarchy:
//     return base;
// }

// function formatDataForValidity(){
// 	console.log("formatDataForValidity", arguments);

// 	if (itemObj.organization === true) {
//         delete itemObj.name.given;
//         delete itemObj.gender;
//         delete itemObj.job;
//         delete itemObj.pilot;
//     } else {
//         delete itemObj.organization;
//     }

//     if (itemObj.address.line === "") {
//         delete itemObj.address.line;
//     } else if (itemObj.address.line) {
//         itemObj.address.line = itemObj.address.line instanceof Array ? itemObj.address.line : itemObj.address.line.split("\n");
//     }

//     //Check input validation
//     var model,
//         validationItem = document.querySelectorAll("tsante-inputtext"),
//         i = 0,
//         invalid = false,
//         item;

//     while (!invalid && i < validationItem.length) {
//         item = validationItem[i];
//         if (!item.validate()) {
//             invalid = true;
//         } else {
//             i++;
//         }
//     }

//     if (invalid) {
//         model = {
//             msg: {
//                 title: "Error",
//                 content: "Bad form validation, check mandatory fields",
//                 buttons: [{
//                     label: "OK",
//                     action: "closeModal();"
//                 }]
//             }
//         };
//         showModal(model);
//         return false;
//     }

//     //Check select required
//     var selectItems = document.querySelectorAll("select[emptyValue]");
//     if (selectItems.length > 0) {
//         model = {
//             msg: {
//                 title: "Error",
//                 content: "Check mandatory select field",
//                 buttons: [{
//                     label: "OK",
//                     action: "closeModal();"
//                 }]
//             }
//         };
//         showModal(model);
//         return false;
//     }

//     //Delete empty string before sending to DB
//     var checkItem = function(parentObj, childObj){
//     	if(parentObj[childObj] === "" || (typeof parentObj[childObj] === "object" && Object.keys(parentObj[childObj]).length === 0)){
//     		delete parentObj[childObj];
//     	}
//     };

//     itemObj.active = itemObj.active === "" ? false : itemObj.active;
//     checkItem(itemObj.name, "given");
//     checkItem(itemObj, "job");
// 	checkItem(itemObj, "communication");
// 	for(i=0; i<itemObj.telecom; i++){
// 		checkItem(itemObj.telecom[i], "system");
// 		checkItem(itemObj.telecom[i], "use");
// 		checkItem(itemObj.telecom[i], "value");
// 	}
// 	checkItem(itemObj.address, "use");
// 	checkItem(itemObj.address, "text");
// 	checkItem(itemObj.address, "city");
// 	checkItem(itemObj.address, "state");
// 	checkItem(itemObj.address, "zip");
// 	checkItem(itemObj.address, "country");
// 	checkItem(itemObj, "address");

// 	//TODO Account
// 	return true;
// }

// function updateItem() {
// 	console.log("updateItem", arguments);
//     closeModal();

//     //Check the validity of the obj to send to the DB
//     if(!formatDataForValidity()){
//     	return;
//     }

//     console.log("updateItem - updateItem: ", itemObj);

//     var xhr = new XMLHttpRequest(),
//         successModel = {
//             msg: {
//                 title: "Success",
//                 content: "Item updated",
//                 buttons: [{
//                     label: "OK",
//                     action: "closeModal(); window.history.back()"
//                 }]
//             }
//         },
//         errorModel = {
//             msg: {
//                 title: "Error",
//                 content: "An error occurred",
//                 buttons: [{
//                     label: "OK",
//                     action: "closeModal();"
//                 }]
//             }
//         },
//         url = "/api/directory",
//         xhrHandle = function(url, method, status, dialogModelSuccess, dialogModelError) {
//             xhr.open(method, url, true);
//             xhr.onload = function() {
//                 var model;
//                 if (xhr.status === status) {
//                     model = dialogModelSuccess;
//                 } else {
//                     model = dialogModelError;
//                     console.log(xhr);
//                 }
//                 showModal(model);
//             };
//             xhr.send(JSON.stringify(itemObj));
//         };

//     if (itemObj._id) {
//         //Update entry
//         xhrHandle(url + "/" + itemObj._id, "PUT", 200, successModel, errorModel);
//     } else {
//         //Creation of entry
//         successModel.msg.content = "Item created";
//         xhrHandle(url, "POST", 200, successModel, errorModel);
//     }
// }

// function confirm(str) {
//     console.log("confirm", arguments);
//     var model = {
//         msg: {
//             title: str.toUpperCase(),
//             content: "Are you sure you want to " + str + " this item ?",
//             buttons: [{
//                 label: "Yes",
//                 action: str + "Item()"
//             }, {
//                 label: "No",
//                 action: "closeModal()"
//             }]
//         }
//     };
//     showModal(model);
// }

// function createEmptyValueForTemplateBinding() {
//     console.log("createEmptyValueForTemplateBinding - itemObj", itemObj);

//     var formElements = document.body.querySelectorAll("*[name]"),
//         elt, eltName;
//     for (var i = 0; i < formElements.length; i++) {
//         elt = formElements[i];
//         eltName = elt.name.slice(elt.name.indexOf(".") + 1); //remove the 'item.' prefixe
//         createNestedObject(itemObj, eltName, "");
//     }
//     console.log("createEmptyValueForTemplateBinding - itemObj end", itemObj);
// }

// function templateReady() {
//     console.log("templateReady");

//     var itemIdParam = getQueryVariable("itemId"),
//         initModel = function() {
//             createEmptyValueForTemplateBinding();
//             //Fill Combobox
//             document.querySelector("#tplInfoContainer").model = {
//                 item: itemObj,
//                 enums: {
//                     enumUse: _tmpUseEnum,
//                     enumSystem: _tmpSystemEnum,
//                     enumRole: _tmpRoleEnum,
//                     enumJob: _tmpJobEnum,
//                     enumCommunication: _tmpCommunicationEnum
//                 }
//             };
//         };
//     console.log("templateReady - itemIdParam", itemIdParam);

//     if (itemIdParam) {
//         //edit mode
//         var coreAjaxElt = document.querySelector("core-ajax");

//         coreAjaxElt.addEventListener("core-response", function(e) {
//             console.log("core-response", arguments);
//             itemObj = e.detail.response;

//             //Due to FF limitation for filtering expression (PolymerExpressions undefined)
//             //format the address.line data joinning the array with '/n' to display it in textarea
//             var address = itemObj.address;
//             if (address && address.line) {
//                 address.line = address.line.join("\n");
//             }

//             initModel();
//         });

//         coreAjaxElt.url += itemIdParam;
//         coreAjaxElt.go();
//     } else {
//         //creation mode
//         initModel();
//     }
// }

// function init() {
//     //TODO internationalization
//     console.log("init");
//     document.querySelector("#tplInfoContainer").addEventListener("template-bound", templateReady, false);
// }

// window.addEventListener("polymer-ready", init, false);
