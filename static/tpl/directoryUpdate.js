"use strict";

var _dataObj = null,
    _accountDataObj = null,
    _useEnum = null,
    _systemEnum = null,
    _roleEnum = null,
    _jobEnum = null,
    _communicationEnum = null;

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

function closeModal() {
    console.log("closeModal", arguments);
    document.querySelector("zdk-modal").hide();

    var elt = document.querySelector("zdk-modal"),
        subElt, child;
    subElt = elt.querySelector(".modalTitleContainer");
    subElt.innerHTML = "";
    subElt.className += "hidden";
    subElt = elt.querySelector(".modalContentContainer");
    subElt.innerHTML = "";
    subElt.className += "hidden";
    subElt = elt.querySelector(".modalButtonContainer");
    for (var i = subElt.childNodes.length - 1; i >= 0; i--) {
        child = subElt.childNodes[i];
        subElt.removeChild(child);
    }
    subElt.className += "hidden";
}

function showModal(modalObj) {
    console.log("showModal", arguments);

    var elt = document.querySelector("zdk-modal"),
        subElt;
    if (modalObj.title) {
        subElt = elt.querySelector(".modalTitleContainer");
        subElt.innerHTML = document.querySelector("#" + modalObj.title).innerHTML;
        subElt.className = subElt.className.replace("hidden", "");
    }
    if (modalObj.content) {
        subElt = elt.querySelector(".modalContentContainer");
        subElt.innerHTML = document.querySelector("#" + modalObj.content).innerHTML;
        subElt.className = subElt.className.replace("hidden", "");
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
            btn.className += color;
            subElt.appendChild(btn);
        }
        subElt.className = subElt.className.replace("hidden", "");
    }

    document.querySelector("zdk-modal").show();
}

function renderPage() {
    console.log("renderPage");

    //Format the address.line (array) to display it in textarea with '\n'
    if (_dataObj && _dataObj._id) {
        var address = _dataObj.address;
        if (address && address.line) {
            address.line = address.line.join("\n");
        }
    } else {
        //Hide the delete button
        document.querySelector("#deleteItem").className += " hidden";
    }
    var elt = document.querySelector(_dataObj && _dataObj._id ? "#saveItemBtn" : "#createItemBtn");
    elt.className = elt.className.replace("hidden", "");

    var idx = 0;
    var modelData = {
        item: _dataObj,
        account: _accountDataObj,
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
        job_list: _jobEnum.items,
        job_selected: function() {
            if (_dataObj && _dataObj.job) {
                return _dataObj.job === this.value ? "selected" : "";
            } else {
                return _jobEnum.defaultValue && _jobEnum.defaultValue === this.value ? "selected" : "";
            }
        },
        role_list: _roleEnum.items,
        role_selected: function() {
            if (_dataObj && _dataObj.role) {
                return _dataObj.role === this.value ? "selected" : "";
            } else {
                return _roleEnum.defaultValue && _roleEnum.defaultValue === this.value ? "selected" : "";
            }
        },
        communication_list: _communicationEnum.items,
        communication_selected: function() {
            if (_dataObj && _dataObj.communication) {
                return _dataObj.communication === this.value ? "selected" : "";
            } else {
                return _communicationEnum.defaultValue && _communicationEnum.defaultValue === this.value ? "selected" : "";
            }
        },
        organization_checked: function() {
            return _dataObj && _dataObj.organization ? "checked" : "";
        },
        organization_disabled: function() {
            return _dataObj ? "disabled" : ""; //if _dataObj, it's an edition, else it's a creation
        },
        active_checked: function() {
            return _dataObj && _dataObj.active ? "checked" : "";
        },
        use_list: _useEnum.items,
        telecom_use_default: function() {
            return _useEnum.defaultValue && _useEnum.defaultValue === this.value ? "selected" : "";
        },
        telecom_use_selected: function() {
            if (_dataObj && _dataObj.telecom && _dataObj.telecom[idx] && _dataObj.telecom[idx].use) {
                return _dataObj.telecom[idx].use === this.value ? "selected" : "";
            } else {
                return _useEnum.defaultValue && _useEnum.defaultValue === this.value ? "selected" : "";
            }
        },
        system_list: _systemEnum.items,
        telecom_system_default: function() {
            return _systemEnum.defaultValue && _systemEnum.defaultValue === this.value ? "selected" : "";
        },
        telecom_system_selected: function() {
            if (_dataObj && _dataObj.telecom && _dataObj.telecom[idx] && _dataObj.telecom[idx].system) {
                return _dataObj.telecom[idx].system === this.value ? "selected" : "";
            } else {
                return _systemEnum.defaultValue && _systemEnum.defaultValue === this.value ? "selected" : "";
            }
        },
        address_use_selected: function() {
            if (_dataObj && _dataObj.address && _dataObj.address.use) {
                return _dataObj.address.use === this.value ? "selected" : "";
            } else {
                return _useEnum.defaultValue && _useEnum.defaultValue === this.value ? "selected" : "";
            }
        },
        telecom_email_type_default: function() {
            return _systemEnum.defaultValue && _systemEnum.defaultValue === "email" ? "email" : "text";
        },
        telecom_email_type: function() {
            if (_dataObj && _dataObj.telecom && _dataObj.telecom[idx] && _dataObj.telecom[idx].system === "email") {
                return "email";
            }
            return "text";
        }
    };
    document.forms.directoryForm.innerHTML = Mustache.render(document.forms.directoryForm.innerHTML, modelData);
    checkOrganization();
    checkDefaultGender();
}

function getDataForRender() {
    console.log("getDataForRender", arguments);

    var _useEnum2, _systemEnum2, _roleEnum2, _jobEnum2, _communicationEnum2;
    _useEnum2 = {
        name: "useEnumList",
        defaultValue: "work",
        items: [{
            value: "-",
            label: ""
        }, {
            value: "home",
            label: "home"
        }, {
            value: "work",
            label: "work"
        }, {
            value: "temp",
            label: "temp"
        }, {
            value: "old",
            label: "old"
        }]
    };
    _systemEnum2 = {
        name: "systemEnumList",
        defaultValue: "email",
        items: [{
            value: "-",
            label: ""
        }, {
            value: "phone",
            label: "phone"
        }, {
            value: "mobile",
            label: "mobile"
        }, {
            value: "email",
            label: "email"
        }]
    };
    _roleEnum2 = {
        name: "roleEnumList",
        items: [{
            value: "administrator",
            label: "administrator"
        }, {
            value: "coordinator",
            label: "coordinator"
        }, {
            value: "physician",
            label: "physician"
        }, {
            value: "medical",
            label: "medical"
        }, {
            value: "social",
            label: "social"
        }]
    };
    _jobEnum2 = {
        name: "jobEnumList",
        defaultValue: "-",
        items: [{
            value: "-",
            label: ""
        }, {
            value: "system administrator",
            label: "system administrator"
        }, {
            value: "coordinator",
            label: "coordinator"
        }, {
            value: "physician",
            label: "physician"
        }, {
            value: "pharmacist",
            label: "pharmacist"
        }, {
            value: "Physician assistant",
            label: "Physician assistant"
        }, {
            value: "dietitian",
            label: "dietitian"
        }, {
            value: "therapist",
            label: "therapist"
        }, {
            value: "paramedic",
            label: "paramedic"
        }, {
            value: "nurse",
            label: "nurse"
        }, {
            value: "professional home carer",
            label: "professional home carer"
        }, {
            value: "social worker",
            label: "social worker"
        }]
    };
    _communicationEnum2 = {
        name: "communicationEnumList",
        defaultValue: "",
        items: [{
            value: "",
            label: ""
        }, {
            value: "fr",
            label: "fr"
        }, {
            value: "es",
            label: "es"
        }, {
            value: "nl",
            label: "nl"
        }, {
            value: "en",
            label: "en"
        }]
    };
    var fakePromise = function(data, timeout, isError) {
        var p = new RSVP.Promise(function(resolve, reject) {
            setTimeout(function() {
                if (!isError) {
                    resolve(data);
                } else {
                    reject("!!! FAKE ERROR !!!");
                }
            }, /*timeout*/ 0);
        });
        return p;
    };
    var promises = {
        useEnum: fakePromise(_useEnum2, 500),
        systemEnum: fakePromise(_systemEnum2, 500),
        roleEnum: fakePromise(_roleEnum2, 600),
        jobEnum: fakePromise(_jobEnum2, 800),
        communicationEnum: fakePromise(_communicationEnum2, 500),
    };

    // var promises = {
    //     useEnum: promiseXHR("GET", "/api/lists/use"),
    //     systemEnum: promiseXHR("GET", "/api/lists/system"),
    //     roleEnum: promiseXHR("GET", "/api/lists/role"),
    //     jobEnum: promiseXHR("GET", "/api/lists/job"),
    //     communicationEnum: promiseXHR("GET", "/api/lists/communication")
    // };

    if (_dataObj && _dataObj._id) {
        promises.account = promiseXHR("GET", "/api/directory/" + _dataObj._id + "/account");
    }

    RSVP.hash(promises).then(function(response) {
        console.log("getDataForRender - RSVP:", response);
        _useEnum = response.useEnum;
        _systemEnum = response.systemEnum;
        _roleEnum = response.roleEnum;
        _jobEnum = response.jobEnum;
        _communicationEnum = response.communicationEnum;

        if (!_useEnum.defaultValue) {
            _useEnum.items.unshift({
                value: "",
                label: ""
            });
        }
        if (!_systemEnum.defaultValue) {
            _systemEnum.items.unshift({
                value: "",
                label: ""
            });
        }
        if (!_roleEnum.defaultValue) {
            _roleEnum.items.unshift({
                value: "",
                label: ""
            });
        }
        if (!_jobEnum.defaultValue) {
            _jobEnum.items.unshift({
                value: "",
                label: ""
            });
        }
        /*
        if (!_communicationEnum.defaultValue) {
            _communicationEnum.items.unshift({
                value: "",
                label: ""
            });
        }
        */
        try {
            if (response.account) {
                _accountDataObj = JSON.parse(response.account);
            }
        } catch (ex) {
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
            console.log("getDataForRender - RSVP error:", ex);
        }

        //Hide loading/Display mainContainer
        document.querySelector(".loading").className += " hidden";
        var elt = document.querySelector(".mainContainer");
        elt.className = elt.className.replace("hidden", "");
        renderPage();

    }).catch(function(error) {
        console.log("getDataForRender - error: ", error);
        var modalObj = {
            title: "trad_error",
            content: "trad_error_occured",
            buttons: [{
                id: "trad_ok",
                action: function() {
                    closeModal();
                    window.history.back();
                }
            }]
        };
        showModal(modalObj);
    });
}

// Function: createNestedObject( base, names[, value] )
//   base: the object on which to create the hierarchy
//   names: an array of strings contaning the names of the objects
//   value (optional): if given, will be the last object in the hierarchy
// Returns: the last object in the hierarchy
function createNestedObject(base, names, value, isEmptyValueAllowed) {
    console.log("createNestedObject", arguments);
    if (!names || value === "" && !isEmptyValueAllowed) {
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
        base = base[lastName] = value;
        //base = base[lastName] = value !== "" && typeof value !== "undefined" ? value : null;
    }

    // Return the last object in the hierarchy:
    return base;
}

function checkDefaultGender() {
    var elt,
        isGenderChecked = false;
    //Firefox fix: set default value for radio button to avoid validation form even if the node is hidden or the required attribute removed
    elt = document.querySelectorAll("form[name=directoryForm] input[name='gender']");
    [].map.call(elt, function(node, idx) {
        if (node.checked) {
            isGenderChecked = true;
        }
    });
    if (!isGenderChecked) {
        //Set default radio checked to avoid form validation in Firefox
        document.querySelector("form[name=directoryForm] input[name='gender']").checked = true;
    }
}

function checkOrganization() {
    console.log("checkOrganization", arguments);
    var elt = document.querySelector("#nonOrgContainer"),
        isOrganization = document.querySelector("form[name=directoryForm] input[name='organization']").checked;

    //Show/Hide relative information to a none organization
    elt.className = isOrganization ? elt.className + " hidden" : elt.className.replace("hidden", "");

    //Firefox fix: set default value for this required input due to validation form even if the node is hidden or the required attribute removed
    elt = document.querySelector("form[name=directoryForm] input[name='name.given']");
    elt.value = isOrganization ? " " : elt.value === " " ? "" : elt.value;
}

function checkEmailTypeValidation(node) {
    console.log("checkEmailTypeValidation", arguments);
    /*
    var isEmail = node.options[node.selectedIndex].value.toLowerCase() === "email";
    node.parentNode.querySelector("input[name='telecom.value']").type = isEmail ? "email" : "text";
    if(isEmail){
    	node.parentNode.querySelector("input[name='telecom.value']").setAttribute("required", true);
    }
    else{
    	node.parentNode.querySelector("input[name='telecom.value']").removeAttribute("required");
    }
    */
}

function checkForm() {
    var modalObj, obj;
    
    function isEmailSet() {
        var isEmail = false,
            systemElt, valueElt;
         
        obj.telecom.forEach( function( item ) {
            if( item.system === "email" && item.value !== "") {
                isEmail = true;
            }
        });
        return isEmail;
    };
    
    obj = form2js(document.forms["directoryForm"]);
    console.log(obj);
    //Check if password are equals
    if( obj.account && obj.account.password !== obj.checkAccountPassword ) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_password",
            buttons: [{
                id: "trad_ok",
                action: function() {
                    closeModal();
                }
            }]
        };
    } 
    if ( !modalObj && !isEmailSet()) {
        //Check if an email is set
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_email_required",
            buttons: [{
                id: "trad_ok",
                action: function() {
                    closeModal();
                }
            }]
        };
    } 
    if( !modalObj &&  (obj.address.line || obj.address.city || obj.address.zip) ) {
        if( !(obj.address.line && obj.address.city && obj.address.zip )) {
            console.log("address is incomplete");
            modalObj = {
                title: "trad_errorFormValidation",
                content: "trad_incomplete_address",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
                        closeModal();
                    }
                }]
            };
        }
    } 
    if( !modalObj ) {
        if (obj._id) {
            modalObj = {
                title  : "trad_update",
                content: "trad_confirm_update",
                buttons: [
                    {
                        id    : "trad_no",
                        action: function () {
                            closeModal();
                        }
                    },
                    {
                        id    : "trad_yes",
                        action: function () {
                            updateItem(obj);
                        }
                    }
                ]
            };
        } else {
            modalObj = {
                title  : "trad_create",
                content: "trad_confirm_create",
                buttons: [
                    {
                        id    : "trad_no",
                        action: function () {
                            closeModal();
                        }
                    },
                    {
                        id    : "trad_yes",
                        action: function () {
                            updateItem(obj);
                        }
                    }
                ]
            };
        }
    }
    
    if( modalObj) {
        showModal(modalObj);
    }
}

function deleteTelecom(node) {
    console.log("deleteTelecom", arguments);
    node.parentNode.parentNode.removeChild(node.parentNode);
}

function addTelecom() {
    console.log("addTelecom", arguments);
    var elt = document.querySelector("#tplTelecomContainer").innerHTML;
    var modelData = { indx:document.querySelectorAll(".telecomContainer").length+1};
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("telecomContainer");
    div.classList.add("row");
    div.innerHTML = html;
    var button = document.querySelector("#addTelecomBtn");
    button.parentNode.insertBefore( div , button );
    /*
    var elt = document.querySelector("#tplTelecomContainer"),
        parentElt = elt.parentNode,
        cloneElt = elt.cloneNode(true);

    //Set require to cloned select element
    //Can't set required on the tplTelecomContainer select elements because when form validation, err : An invalid form control with name='telecom.system' is not focusable.
    elt = cloneElt.querySelectorAll("select");
    [].map.call(elt, function(node) {
        node.setAttribute("required", true);
    });

	checkEmailTypeValidation(cloneElt.querySelector("select[name='telecom.system']"));

    cloneElt.className = cloneElt.className.replace("hidden", "");
    parentElt.insertBefore(cloneElt, parentElt.querySelector("#addTelecomBtn"));
    */
}

function getUserFormData() {
    console.log("getUserFormData", _dataObj);

    var itemObj = {},
        elt, eltName;

    eltName = "name.family";
    createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);
    if (_dataObj && _dataObj._id) { //update mode
        _dataObj.name.family = itemObj.name.family;
    }

    eltName = "organization";
    elt = document.querySelector("form[name=directoryForm] input[name='" + eltName + "']");
    if (elt.checked) {
        //Organizationelt.checked;
        createNestedObject(itemObj, eltName, elt.checked);
        if (_dataObj && _dataObj._id) { //update mode
            _dataObj.organization = itemObj.organization;
        }
    } else {
        //!Organization
        eltName = "name.given";
        createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);
        if (_dataObj && _dataObj._id) { //update mode
            _dataObj.name.given = itemObj.name.given;
        }

        eltName = "gender";
        elt = document.querySelectorAll("form[name=directoryForm] input[name='" + eltName + "']");
        [].map.call(elt, function(node) {
            if (node.checked) {
                createNestedObject(itemObj, eltName, node.value);
            }
        });
        if (_dataObj && _dataObj._id) {
            _dataObj.gender = itemObj.gender;
        }

        eltName = "job";
        elt = document.querySelector("form[name=directoryForm] select[name='" + eltName + "']");
        createNestedObject(itemObj, eltName, elt.options[elt.selectedIndex].value);
        if (_dataObj && _dataObj._id) {
            _dataObj.job = itemObj.job;
        }
    }

    eltName = "role";
    elt = document.querySelector("form[name=directoryForm] select[name='" + eltName + "']");
    createNestedObject(itemObj, eltName, elt.options[elt.selectedIndex].value);
    if (_dataObj && _dataObj._id) {
        _dataObj.role = itemObj.role;
    }

    eltName = "communication";
    elt = document.querySelector("form[name=directoryForm] select[name='" + eltName + "']");
    createNestedObject(itemObj, eltName, elt.options[elt.selectedIndex].value);
    if (_dataObj && _dataObj._id) {
        _dataObj.communication = itemObj.communication;
    }

    eltName = "active";
    elt = document.querySelector("form[name=directoryForm] input[name='" + eltName + "']");
    createNestedObject(itemObj, eltName, elt.checked);
    if (_dataObj && _dataObj._id) {
        _dataObj.active = itemObj.active;
    }

    //telecom
    elt = document.querySelectorAll("form[name=directoryForm] .telecomContainer:not(.hidden)");
    var subElt;
    [].map.call(elt, function(node, idx) {
        if (idx === 0) {
            itemObj.telecom = [];
        }
        itemObj.telecom.push({});
        eltName = "telecom.use";
        subElt = node.querySelector("select[name='" + eltName + "']");
        itemObj.telecom[idx].use = subElt.options[subElt.selectedIndex].value;
        eltName = "telecom.system";
        subElt = node.querySelector("select[name='" + eltName + "']");
        itemObj.telecom[idx].system = subElt.options[subElt.selectedIndex].value;
        eltName = "telecom.value";
        subElt = node.querySelector("input[name='" + eltName + "']");
        if (subElt.value !== "") {
            itemObj.telecom[idx].value = subElt.value;
        }
    });
    if (_dataObj && _dataObj._id) {
        if (itemObj.telecom) {
            _dataObj.telecom = itemObj.telecom;
        } else {
            delete _dataObj.telecom;
        }
    }

    eltName = "address.use";
    elt = document.querySelector("form[name=directoryForm] select[name='" + eltName + "']");
    createNestedObject(itemObj, eltName, elt.options[elt.selectedIndex].value);

    eltName = "address.text";
    createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);

    eltName = "address.line";
    elt = document.querySelector("form[name=directoryForm] textarea[name='" + eltName + "']");

    if (elt.value !== "") {
        createNestedObject(itemObj, eltName, elt.value.split("\n"));
    }

    eltName = "address.city";
    createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);

    eltName = "address.state";
    if(document.querySelector("form[name=directoryForm] input[name='" + eltName + "']")) {
        createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);
    }
    
    eltName = "address.zip";
    createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);

    eltName = "address.country";
    if(document.querySelector("form[name=directoryForm] input[name='" + eltName + "']" )) {
        createNestedObject(itemObj, eltName, document.querySelector("form[name=directoryForm] input[name='" + eltName + "']").value);
    }

    if (_dataObj && _dataObj._id) {
        if (itemObj.address) {
            _dataObj.address = itemObj.address;
        } else {
            delete _dataObj.address;
        }
    }

    console.log("getUserFormData - result: ", _dataObj && _dataObj._id ? _dataObj : itemObj);
    return _dataObj && _dataObj._id ? _dataObj : itemObj;
}

function updateItem(obj) {
    console.log("updateItem");

    closeModal();
    var modalObj, data, accountData;
    // remove uneeded fields
    delete obj.checkAccountPassword;  // move to check
    accountData = obj.account?obj.account:null;
    if( accountData && !( accountData.login && accountData.password )) {
        accountData = null;
    }
    data = obj;
    delete data.account;
    data.active = data.active?true:false;
    
    // check address
    if( !(data.address.line && data.address.zip && data.address.city) ) {
        delete data.address;
    } else {
        data.address.line = data.address.line.split("\n");
    }
    
    if (data._id) {
        //Update entry
        var tabPromises = [promiseXHR("PUT", "/api/directory/" + data._id, 200, JSON.stringify(data))];

        if (accountData) {
            tabPromises.push(promiseXHR("POST", "/api/directory/" + data._id + "/account", 200, JSON.stringify(accountData)));
        }

        RSVP.all(tabPromises).then(function() {
            modalObj = {
                title: "trad_success",
                content: "trad_success_update",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
                        closeModal();
                        window.history.back();
                    }
                }]
            };
            showModal(modalObj);
        }).catch(function(error) {
            modalObj = {
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
            console.log("updateItem - error: ", error);
        });
    } else {
        var callSuccess = function() {
            var modalObj = {
                title: "trad_success",
                content: "trad_success_create",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
                        closeModal();
                        window.history.back();
                    }
                }]
            };
            showModal(modalObj);
        };

        promiseXHR("POST", "/api/directory", 200, JSON.stringify(data)).then(function(response) {
           	var res = JSON.parse(response);
            return res._id;
        }).then(function(userID) {
            if (accountData && userID) {
                promiseXHR("POST", "/api/directory/" + userID + "/account", 200, JSON.stringify(accountData)).then(function() {
                    callSuccess();
                });
            } else {
                callSuccess();
            }
        }).catch(function(error) {
            modalObj = {
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
            console.log("updateItem - error: ", error);
        });
    }
}

function confirmDelete() {
    var modalObj = {
        title: "trad_delete",
        content: "trad_confirm_delete",
        buttons: [{
            id: "trad_yes",
            action: function() {
                deleteItem();
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

function deleteItem() {
    console.log("deleteItem", arguments);
    var modalObj;
    closeModal();
    var obj = form2js(document.forms["directoryForm"]);
    if (obj._id) {
        promiseXHR("DELETE", "/api/directory/" + obj._id, 410).then(function(response) {
            modalObj = {
                title: "trad_success",
                content: "trad_success_delete",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
                        closeModal();
                        window.history.back();
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
                        closeModal();
                    }
                }]
            };
            showModal(modalObj);
            console.log("deleteItem - error: ", error);
        });
    }
}

function init() {
    console.log("init");
    var getQueryVariable = function(variable) {
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
        },
        itemIdParam = getQueryVariable("itemId");
    console.log("init - itemIdParam", itemIdParam);
    
    if (itemIdParam) {
        /*
        //edit mode
        var coreAjaxElt = document.querySelector("core-ajax");

        coreAjaxElt.addEventListener("core-response", function(e) {
            console.log("core-response", arguments);
            _dataObj = e.detail.response;
            getDataForRender();
        });

        coreAjaxElt.url += itemIdParam;
        coreAjaxElt.go();
        */
    } else {
        /*
        //creation mode
        console.log("init - creation");
        getDataForRender();
        */
    }
    
}

// window.addEventListener("polymer-ready", init, false);
