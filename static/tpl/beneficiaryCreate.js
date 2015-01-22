"use strict";

var _dataObj = null,
    _dataObjTmp = null,
    _dataLists = null,
    _dataAllProfessionnalObj = null,
    _idxNbTelecom = 0,
    _idxNbAddress = 0,
    _langCookie = null,
    _momentFormat = null,
    _currentNodeCalendar = null,
    tsanteListProfessionalElt = null;

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

function _findProfessionalInBeneficiary(id, obj) {
    console.log("_findProfessionalInBeneficiary", arguments);
    var found = false,
        i = 0;

    if (!obj || !obj.professionals) {
        return null;
    }

    while (!found && i < obj.professionals.length) {
        if (obj.professionals[i]._id === id) {
            found = true;
        } else {
            i++;
        }
    }

    return found ? i : null;
}

function _findReferentInBeneficiary(obj) {
    console.log("_findReferentInBeneficiary", arguments);
    var found = false,
        i = 0;

    if (!obj || !obj.professionals) {
        return null;
    }

    while (!found && i < obj.professionals.length) {
        if (obj.professionals[i].referent === true) {
            found = true;
        } else {
            i++;
        }
    }

    return found ? i : null;
}

function updateProfessionalReferent(node, idxItem) {
    console.log("updateProfessionalReferent", arguments);

    var currentItem = _dataAllProfessionnalObj && _dataAllProfessionnalObj.items && _dataAllProfessionnalObj.items[idxItem];
    if (currentItem) {
        //Remove old referent
        var oldReferentIdx = _findReferentInBeneficiary(_dataObjTmp);
        if (oldReferentIdx !== null) {
            if (_dataObjTmp.professionals[oldReferentIdx]._id !== currentItem._id) {
                _dataObjTmp.professionals[oldReferentIdx].referent = false;
            }
        }

        var idx = _findProfessionalInBeneficiary(currentItem._id, _dataObjTmp);
        if (idx !== null) {
            //Professional already selected
            _dataObjTmp.professionals[idx].referent = true;
        } else {
            //Professional !already selected
            _dataObjTmp.professionals = _dataObjTmp.professionals || [];
            var newObj = JSON.parse(JSON.stringify(currentItem));
            newObj.referent = true;
            _dataObjTmp.professionals.push(newObj);
        }
    }
    //A referent is necessary selected
    node.parentNode.parentNode.querySelector("input[name='selected']").checked = true;
}

function updateProfessionalSelection(node, idxItem) {
    console.log("updateProfessionalSelection", arguments);

    if (!node.checked && node.parentNode.parentNode.querySelector("input[name='referent']").checked) {
        //Can't unselect a referent professional
        node.checked = true;
    } else {
        var currentItem = _dataAllProfessionnalObj && _dataAllProfessionnalObj.items && _dataAllProfessionnalObj.items[idxItem];
        if (currentItem) {
            var idx = _findProfessionalInBeneficiary(currentItem._id, _dataObjTmp);
            if (idx !== null) {
                //Professional already selected
                if (!node.checked) {
                    //Delete it
                    _dataObjTmp.professionals.splice(idx, 1);
                }
            } else {
                //Professional !already selected
                if (node.checked) {
                    //Add it
                    _dataObjTmp.professionals = _dataObjTmp.professionals || [];
                    var newObj = JSON.parse(JSON.stringify(currentItem));
                    newObj.referent = false;
                    _dataObjTmp.professionals.push(newObj);
                }
            }
        }
    }
}

function _removeAllProfessionals() {
    console.log("_removeAllProfessionals");
    var items = document.querySelectorAll("form[name='professionals'] .proItemContainer"),
        form = document.querySelector("form[name='professionals']");
    [].map.call(items, function(item) {
        form.removeChild(item);
    });
}

function _addProfessional(professionalItem) {
    console.log("_addProfessional", arguments);
    var html, div,
        elt = document.querySelector("#tplProfessionnalContainer").innerHTML,
        isFirstItem = true,
        modelData = {
            item: professionalItem,
            display_job: function(){
                var str = professionalItem.job;
                if(_dataLists && _dataLists.job && _dataLists.job.items && 
                    _dataLists.job.items[professionalItem.job] && 
                    _dataLists.job.items[professionalItem.job][_langCookie]){
                    str = _dataLists.job.items[professionalItem.job][_langCookie];
                }
                return str;
            },
            display_phone: function() {
                var res = "";
                if (this.system !== "email") {
                    if (isFirstItem) {
                        isFirstItem = false;
                    } else {
                        res = " / ";
                    }
                    return res + this.value;
                }
                return "";
            },
            display_email: function() {
                return (this.system === "email") ? "<a href=mailto:" + this.value + ">" + this.value + "</a>" : "";
            }
        };

    html = Mustache.render(elt, modelData);
    div = document.createElement("div");
    div.className = "proItemContainer";
    div.innerHTML = html;
    document.querySelector("form[name='professionals']").insertBefore(div, document.querySelector("form[name='professionals'] .row.control"));
}

function _onHaveProfessionalsData(data) {
    console.log("onHaveProfessionalsData", data);
    _dataAllProfessionnalObj = data.detail.list;
    //Check already selected professionals
    var proTab = _dataObjTmp.professionals;
    _dataAllProfessionnalObj.items.map(function(item) {
        var selected = false,
            referent = false,
            proItem,
            i = 0;
    
        while (!selected && i < proTab.length) {
            proItem = proTab[i];
            if (item._id === proItem._id) {
                selected = true;
                if (proItem.referent) {
                    referent = true;
                }
            }
            i++;
        }
        item._tmpData = {};
        item._tmpData.selected = selected;
        item._tmpData.referent = referent;
    });
    
    //Added job array to display friendly user string for job instead of the reference
    var obj = _dataAllProfessionnalObj;
    obj.dataLists = _dataLists;
    obj.lang = _langCookie;
    tsanteListProfessionalElt.render(obj);
}

function _checkDateFormat(strDate) {
    return moment(strDate, _momentFormat, _langCookie, true).isValid();
}

function _checkIsBeforeDate(firstDate, secondDate) {
    // return moment(firstDate, _momentFormat, _langCookie, true).isBefore(secondDate, "day");
    return ( firstDate < secondDate );
}

function _convertDate(strDate) {
    //Format date to YYYY-MM-DD for the database schema validation
    return moment(strDate, _momentFormat).format("YYYY-MM-DD");
}

function showProfessionals() {
    console.log("showProfessionals");
    //TODO: check the perimeter to filter the url for the listpager
    //var url = document.querySelector("#addProfessionalsModal #tsanteListProfessional") + "?filter={perimeter: xxx}";
    tsanteListProfessionalElt.go();
    //Store the obj in a clone (for cancel case on modal)
    _dataObjTmp = (_dataObj && _dataObj.professionals) ? JSON.parse(JSON.stringify(_dataObj)) : {
        professionals: []
    };
    document.querySelector("#addProfessionalsModal").show();
}

function closeProfessionals() {
    console.log("closeProfessionals");
    _dataObjTmp = null;
    document.querySelector("#addProfessionalsModal").hide();
}

function addProfessionals() {
    console.log("addProfessionals");

    //Case of new entry
    if (!_dataObj) {
        _dataObj = {
            professionals: []
        };
    }

    if (_dataObjTmp && _dataObjTmp.professionals) {
        _dataObj.professionals = JSON.parse(JSON.stringify(_dataObjTmp.professionals));
        _removeAllProfessionals();
        _dataObj.professionals.map(function(proItem) {
            _addProfessional(proItem);
        });
    }
    closeProfessionals();
}

function deleteProfessional(node) {
    console.log("deleteProfessional", arguments);
    var child = node.parentNode.parentNode.parentNode,
        id = child.querySelector("input[name='professional_id']").value,
        idx;

    idx = _findProfessionalInBeneficiary(id, _dataObj);
    if (idx !== null) {
        _dataObj.professionals.splice(idx, 1);
    }

    while (!node.classList.contains("proItemContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function updateProfessionals(obj) {
    console.log("updateProfessionals", obj);
    var modalObj;
    if (obj && _dataObj && _dataObj._id) {
        promiseXHR("POST", "/api/beneficiaries/" + _dataObj._id + "/professionals", 200, JSON.stringify(obj)).then(function() {
            modalObj = {
                title: "trad_success",
                content: "trad_success_update",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
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
                        closeModal();
                    }
                }]
            };
            showModal(modalObj);
            console.log("updateProfessionals - update error: ", error);
        });
    }
}

function checkEntryForm() {
    console.log("checkEntryForm");
    var modalObj,
        formObj = form2js(document.querySelector("form[name='entry']"));

    //Check date format
    /*
    if (!_checkDateFormat(formObj.entry.startDate) || !_checkDateFormat(formObj.entry.plannedEnd) || !_checkDateFormat(formObj.entry.endDate)) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_date",
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
    */
    //Check date before/after
    if (formObj.entry.startDate && formObj.entry.plannedEnd && !_checkIsBeforeDate(formObj.entry.startDate, formObj.entry.plannedEnd)) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_date_before",
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

    if( formObj.entry.startDate &&  formObj.entry.endDate && !_checkIsBeforeDate(formObj.entry.startDate, formObj.entry.endDate)) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_date_before",
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
    return formObj;
}

function checkLifeCondForm() {
    console.log("checkLifeCondForm");
    //Nothing to check
    return form2js(document.querySelector("form[name='life_condition']"));
}

function checkAccountForm() {
    console.log("checkAccountForm");
    var modalObj,
        formObj = form2js(document.querySelector("form[name='account']"));

    //Check if password are equals
    if ((formObj.checkAccountPassword && !formObj.account) ||
        (formObj.account && formObj.account.password !== formObj.checkAccountPassword)) {
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
        showModal(modalObj);
        return false;
    }

    if (formObj.account && !formObj.account.login && formObj.account.password) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_passwordNoLogin",
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

    delete formObj.checkAccountPassword;
    if (formObj.telecom) {
        formObj.telecom.system = "email";
    }

    return formObj;
}

function checkProfessionalsForm(backgroundTask) {
    console.log("checkProfessionalsForm");

    var modalObj,
        obj = [];
    if (_dataObj.professionals) {
        _dataObj.professionals.map(function(item) {
            obj.push({
                professionalID: item._id,
                referent: item.referent
            });
        });
    }

    if (!backgroundTask) {
        var modalObj = {
            title: "trad_save",
            content: "trad_confirm_save",
            buttons: [{
                id: "trad_no",
                action: function() {
                    closeModal();
                }
            }, {
                id: "trad_yes",
                action: function() {
                    updateProfessionals(obj);
                    closeModal();
                }
            }]
        };
        showModal(modalObj);
    }

    return obj;
}

function checkDiagnosisForm() {
    console.log("checkDiagnosisForm");
    //Nothing to check
    return form2js(document.querySelector("form[name='diagnosis']"));
}

function updateAll(obj) {
    console.log("updateAll", obj);
    var modalObj;
    if (_dataObj && _dataObj._id) {
        promiseXHR("PUT", "/api/beneficiaries/" + _dataObj._id, 200, JSON.stringify(obj)).then(function() {
            modalObj = {
                title: "trad_success",
                content: "trad_success_update",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
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
                        closeModal();
                    }
                }]
            };
            showModal(modalObj);
            console.log("updateAll - update error: ", error);
        });
    }
}

function checkAllForms(isValidate) {
    console.log("checkAllForms");
    var forms = document.querySelectorAll("form"),
        formsObj = {},
        obj, invalid = false,
        btn, modalObj;
    //To force the HTML5 form validation on each form if needed, set click on hidden submit button
    //form.submit() doesn't call the HTML5 form validation on elements
    [].map.call(forms, function(form) {
        if (!form.checkValidity()) {
            console.log("form invalid", form.name);
            invalid = true;
            btn = document.querySelector("#" + form.name + "SubmitBtn");
            if (btn) {
                btn.click();
            }
        }
    });

    if (invalid) {
        return false;
    }

    var mixin = function(dest, source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                dest[prop] = source[prop];
            }
        }
    };

    //Beneficiary
    obj = checkBeneficiaryForm(true);
    if (!obj) {
        return false;
    }
    mixin(formsObj, obj);

    //Entry
    obj = checkEntryForm();
    if (!obj) {
        return false;
    }
    mixin(formsObj, obj);

    //Life condition
    obj = checkLifeCondForm();
    if (!obj) {
        return false;
    }
    mixin(formsObj, obj);

    //Account
    obj = checkAccountForm();
    if (!obj) {
        return false;
    }
    if (obj.telecom) {
        //Carefull, the telecom.system "email" is set in this panel, so adjust data to put it in the telecom subObj
        formsObj.telecom = formsObj.telecom || [];
        formsObj.telecom.push(obj.telecom);
    }
    if (obj.account) {
        formsObj.account = formsObj.account || {};
        mixin(formsObj.account, obj.account);
    }

    //Professionals
    obj = checkProfessionalsForm(true);
    if (!obj) {
        return false;
    }
    formsObj.professionals = obj;

    //Diagnosis
    obj = checkDiagnosisForm();
    if (!obj) {
        return false;
    }
    mixin(formsObj, obj);

    //TODO: add request for account
    console.log("formsObj", formsObj);
    if (isValidate) {
        formsObj.validate = true;
    }

    modalObj = {
        title: "trad_save",
        content: "trad_confirm_save",
        buttons: [{
            id: "trad_no",
            action: function() {
                closeModal();
            }
        }, {
            id: "trad_yes",
            action: function() {
                updateAll(formsObj);
                closeModal();
            }
        }]
    };
    showModal(modalObj);

    return true;
}

function deleteTelecom(node) {
    console.log("deleteTelecom", arguments);
    while (!node.classList.contains("telecomContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function addTelecom() {
    console.log("addTelecom");
    var elt = document.querySelector("#tplTelecomContainer").innerHTML;
    var modelData = {
        idx: ++_idxNbTelecom
    };
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("telecomContainer");
    div.innerHTML = html;
    var button = document.querySelector("#addTelecomBtn");
    button.parentNode.insertBefore(div, button);
}

function deleteAddress(node) {
    console.log("deleteAddress", arguments);
    while (!node.classList.contains("addressContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function addAddress() {
    console.log("addAddress");
    var elt = document.querySelector("#tplAddressContainer").innerHTML;
    var modelData = {
        idx: ++_idxNbAddress
    };
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("addressContainer");
    div.innerHTML = html;
    var button = document.querySelector("#addAddressBtn");
    button.parentNode.insertBefore(div, button);
}

function updateBeneficiary(obj) {
    console.log("updateBeneficiary", obj);
    var modalObj;

    if (obj._id) {
        //Update
        promiseXHR("PUT", "/api/beneficiaries/" + obj._id, 200, JSON.stringify(obj)).then(function() {
            modalObj = {
                title: "trad_success",
                content: "trad_success_update",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
                        window.location.href = "/beneficiary/overview";
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
                        closeModal();
                    }
                }]
            };
            showModal(modalObj);
            console.log("updateBeneficiary - update error: ", error);
        });
    } else {
        //Creation
        promiseXHR("POST", "/api/beneficiaries", 200, JSON.stringify(obj)).then(function(response) {
            _dataObj = JSON.parse(response);
            document.querySelector("form[name='beneficiary'] input[name='_id']").value = _dataObj._id;
            //Enable others panel
            var items = document.querySelectorAll(".waitForId");
            [].map.call(items, function(node) {
                node.removeAttribute("disabled");
            });
            //Display the delete button
            document.querySelector("#deleteBeneficiary").classList.remove("hidden");

            modalObj = {
                title: "trad_create",
                content: "trad_success_create",
                buttons: [{
                    id: "trad_ok",
                    action: function() {
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
                        closeModal();
                    }
                }]
            };
            showModal(modalObj);
            console.log("updateBeneficiary - create error: ", error);
        });
    }
}

function confirmDeleteBeneficiary() {
    var modalObj = {
        title: "trad_delete",
        content: "trad_confirm_delete",
        buttons: [{
            id: "trad_yes",
            action: function() {
                deleteBeneficiary();
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

function deleteBeneficiary() {
    console.log("deleteBeneficiary");
    var modalObj;
    if (_dataObj && _dataObj._id) {
        promiseXHR("DELETE", "/api/beneficiaries/" + _dataObj._id, 410).then(function(response) {
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
            console.log("deleteBeneficiary - error: ", error);
        });
    }
}

function checkBeneficiaryForm(backgroundTask) {
    var modalObj,
        obj = form2js(document.querySelector("form[name='beneficiary']"));
    console.log("checkBeneficiaryForm", obj);

    if (!_checkDateFormat(obj.birthdate)) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_date",
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

    if (isNaN(parseFloat(obj.size))) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_size",
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

    if (!obj.address) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_noAddress",
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

    if (!obj.telecom) {
        modalObj = {
            title: "trad_errorFormValidation",
            content: "trad_error_noTelecom",
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

    //Adjust data before sending
    obj.birthdate = _convertDate(obj.birthdate);
    obj.address.map(function(addr) {
        if (addr.line) {
            addr.line = addr.line.split("\n");
        }
    });
    obj.size = parseFloat(obj.size) / 100;
    obj.validate = obj.validate === "true" ? true : false;

    if (!backgroundTask) {
        modalObj = {
            title: "trad_save",
            content: "trad_confirm_save",
            buttons: [{
                id: "trad_no",
                action: function() {
                    closeModal();
                }
            }, {
                id: "trad_yes",
                action: function() {
                    updateBeneficiary(obj);
                    closeModal();
                }
            }]
        };
        showModal(modalObj);
    }
    return obj;
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

function showCalendar(node) {
    _currentNodeCalendar = node;
    if(node.value !== ""){
        //if there is a value, open the calendar to this date
        document.querySelector("#calendarModal zdk-calendar").setAttribute("date", node.value);
    }
    document.querySelector("#calendarModal").show();
}

function onHaveDateSelection(data) {
    if (data && data.detail && data.detail.day && _currentNodeCalendar) {
        _currentNodeCalendar.value = data.detail.day;
    }
    document.querySelector("#calendarModal").hide();
}

function init() {
    console.log("init");
    tsanteListProfessionalElt = document.querySelector("#tsanteListProfessional");
    tsanteListProfessionalElt.addEventListener("tsante-response", _onHaveProfessionalsData, false);

    var promises,
        id = document.querySelector("form[name='beneficiary'] input[name='_id']").value;
    if (id) {
        promises = {
            beneficiary: promiseXHR("GET", "/api/beneficiaries/" + id, 200),
            professionals: promiseXHR("GET", "/api/beneficiaries/" + id + "/professionals", 200)
        };

        RSVP.hash(promises).then(function(results) {
            if (results.beneficiary) {
                _dataObj = JSON.parse(results.beneficiary);
            }
            if (results.professionals) {
                _dataObj = _dataObj || {};
                _dataObj.professionals = JSON.parse(results.professionals);
            }
        }).catch(function(error) {
            console.log("Init error", error);
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
        });
    } else {
        //Disable panels except the first until the user save the first one (beneficiary) to get an ID
        var items = document.querySelectorAll(".waitForId");
        [].map.call(items, function(node) {
            node.setAttribute("disabled", true);
        });
        //hide the delete button
        document.querySelector("#deleteBeneficiary").classList.add("hidden");
    }

    promises = {
        job: promiseXHR("GET", "/api/lists/job/array", 200)/*,
        role: promiseXHR("GET", "/api/lists/role/array", 200)*/
    };
    var errorCB = function(error){
        console.log("Init error", error);
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
    }

    //Used to match the job reference to a friendly user display
    RSVP.hash(promises).then(function(results) {
        try{
            _dataLists = {};
            _dataLists.job = JSON.parse(results.job);
            /*_dataLists.role = JSON.parse(results.role);*/
        }
        catch(err){
            errorCB(err);
        }
    }).catch(function(error) {
        errorCB(error);
    });

    //Used for count index for adding new telecom/address field data
    _idxNbTelecom = document.querySelectorAll(".telecomContainer").length;
    _idxNbAddress = document.querySelectorAll(".addressContainer").length;

    //Set placeholder for date input according to the local from lang cookie
    //TODO get lang cookie
    _langCookie = "en";
    _momentFormat = moment.localeData(_langCookie).longDateFormat("L");
    [].map.call(document.querySelectorAll(".date"), function(item) {
        item.setAttribute("placeholder", _momentFormat);
    });

    //Set locale to the calendar and add listener for date selection
    var elt = document.querySelector("#calendarModal zdk-calendar");
    elt.setAttribute("i18n", _langCookie);
    elt.addEventListener("select", onHaveDateSelection);
}

window.addEventListener("polymer-ready", init, false);
