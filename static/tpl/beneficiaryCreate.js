"use strict";

var _dataObj = null,
    _dataObjTmp = null,
    _dataAllProfessionnalObj = null,
    _idxNbTelecom = 0,
    _idxNbAddress = 0,
    _langCookie = null,
    _momentFormat = null;

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
    if (_dataObjTmp && _dataObjTmp.professionals && _dataObjTmp.professionals.length > 0 && _dataAllProfessionnalObj && _dataAllProfessionnalObj.items) {
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

        document.querySelector("#tsanteListProfessional template").model = {
            list: _dataAllProfessionnalObj
        };
    }
}

function _checkDateFormat(strDate) {
    return moment(strDate, _momentFormat, _langCookie, true).isValid();
}

function _convertDate(strDate) {
    //Format date to YYYY-MM-DD for the database schema validation
    return moment(strDate, _momentFormat).format("YYYY-MM-DD");
}

function showProfessionals() {
    console.log("showProfessionals");
    //TODO: check the perimeter to filter the url for the listpager
    //var url = document.querySelector("#addProfessionalsModal #tsanteListProfessional") + "?filter={perimeter: xxx}";
    document.querySelector("#addProfessionalsModal #tsanteListProfessional").go();
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

function updateProfessionals() {
    console.log("updateProfessionals", _dataObj);

    if (_dataObj && _dataObj._id) {
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
        console.log("updateProfessionals obj", obj);

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

function checkProfessionalsForm() {
    console.log("checkProfessionalsForm");

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
                updateProfessionals();
                closeModal();
            }
        }]
    };
    showModal(modalObj);
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

function checkBeneficiaryForm() {
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
    obj.size = parseFloat(obj.size);
    obj.validate = obj.validate === "true" ? true : false;

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
    return true;
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

function init() {
    console.log("init");
    document.querySelector("#tsanteListProfessional").addEventListener("tsante-response", _onHaveProfessionalsData, false);

    var id = document.querySelector("form[name='beneficiary'] input[name='_id']").value;
    if (id) {
        var promises = {
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
}

window.addEventListener("DOMContentLoaded", init, false);
