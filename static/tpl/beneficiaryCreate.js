"use strict";

var _dataObj = null,
    _dataObjTmp = null,
    _dataAllProfessionnalObj = null;

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

function showProfessionals() {
    console.log("showProfessionals");
    //TODO: check the perimeter to filter the url for the listpager
    //var url = document.querySelector("#addProfessionalsModal #tsanteListProfessional") + "?filter={perimeter: xxx}";
    document.querySelector("#addProfessionalsModal #tsanteListProfessional").go();
    //Store the obj in a clone (for cancel case on modal)
    _dataObjTmp = (_dataObj && _dataObj.professionals) ? JSON.parse(JSON.stringify(_dataObj)) : {professionals:[]};
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
    if(!_dataObj){
        _dataObj = {professionals: []};
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

function saveProfessionals() {
    console.log("saveProfessionals", _dataObj);
    closeModal();
    //TODO: waiting for updateProfessional
    ///api/beneficiaries/:entryID/professionals
}

function confirmSaveProfessionals() {
    console.log("confirmSaveProfessionals");


    //TODO: check there is a referent if selected professionals


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
                saveProfessionals();
            }
        }]
    };
    showModal(modalObj);
}

function checkForm1() {
    var obj = form2js(document.querySelector("form[name='beneficiary']"));
    console.log("checkForm1", obj);
    if (isNaN(parseFloat(obj.size))) {
        alert("size must be a number");
    } else {
        obj.size = parseFloat(obj.size);
    }
    obj.validate = obj.validate === "true" ? true : false;
    obj.address[0].line = obj.address[0].line.split("\n");
    if (!obj.telecom[0].value) {
        delete obj.telecom;
    }
    var xhr = new XMLHttpRequest();
    if (obj._id) {
        xhr.open("PUT", "/api/beneficiaries/" + obj._id, false);
        xhr.send(JSON.stringify(obj));
        if (xhr.status === 200) {
            alert("beneficiary saved");
        } else {
            alert("error when saving beneficiary");
        }
    } else {
        xhr.open("POST", "/api/beneficiaries", false);
        xhr.send(JSON.stringify(obj));
        if (xhr.status === 200) {
            alert("beneficiary saved");
            var result = JSON.parse(xhr.responseText);
            document.querySelector("form[name='beneficiary']")._id = result._id;
        } else {
            alert("error when saving beneficiary");
        }
    }
}

function closeModal() {
    console.log("closeModal", arguments);
    document.querySelector("#statusModal").hide();

    var elt = document.querySelector("#statusModal"),
        subElt, child;
    subElt = elt.querySelector(".modalTitleContainer");
    subElt.innerHTML = "";
    subElt.className += " hidden";
    subElt = elt.querySelector(".modalContentContainer");
    subElt.innerHTML = "";
    subElt.className += " hidden";
    subElt = elt.querySelector(".modalButtonContainer");
    for (var i = subElt.childNodes.length - 1; i >= 0; i--) {
        child = subElt.childNodes[i];
        subElt.removeChild(child);
    }
    subElt.className += " hidden";
}

function showModal(modalObj) {
    console.log("showModal", arguments);

    var elt = document.querySelector("#statusModal"),
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
            //TODO modal d'erreur à afficher
        });
    }
}

window.addEventListener("DOMContentLoaded", init, false);
