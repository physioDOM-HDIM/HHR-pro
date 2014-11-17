"use strict";

var _dataObj = null,
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

function showProfessionals() {
    console.log("showProfessionals");
    //TODO: check the perimeter to filter the url for the listpager
    //var url = document.querySelector("#addProfessionalsModal #tsanteListProfessional") + "?filter={perimeter: xxx}";
    document.querySelector("#addProfessionalsModal #tsanteListProfessional").go();

    document.querySelector("#addProfessionalsModal").show();
}

function saveProfessionals() {
    console.log("saveProfessionals");
    if (_dataObj && _dataObj.professionals) {
        removeAllProfessionals();
        _dataObj.professionals.map(function(proItem) {
            //console.log(proItem.name.family + " " + proItem.name.given + " - " + proItem.referent);
            addProfessional(proItem);
        });
    }
    closeProfessionals();
}

function closeProfessionals() {
    console.log("closeProfessionals");
    document.querySelector("#addProfessionalsModal").hide();
}

function removeAllProfessionals() {
    var items = document.querySelectorAll("form[name='professionals'] .proItemContainer"),
        form = document.forms.professionals;
    [].map.call(items, function(item) {
        form.removeChild(item);
    });
}

function addProfessional(professionalItem) {
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
    document.forms.professionals.insertBefore(div, document.querySelector("form[name='professionals'] .row.control"));
}

function onHaveProfessionalsData(data) {
    console.log("onHaveProfessionalsData", data);
    _dataAllProfessionnalObj = data.detail.list;
    //Check already selected professionals
    if (_dataObj && _dataObj.professionals && _dataObj.professionals.length > 0 && _dataAllProfessionnalObj && _dataAllProfessionnalObj.items) {
        var proTab = _dataObj.professionals;
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

function _findProfessionalInBeneficiary(id) {
    console.log("_findProfessionalInBeneficiary", arguments);
    var found = false,
        i = 0;

    if (!_dataObj || !_dataObj.professionals) {
        return null;
    }

    while (!found && i < _dataObj.professionals.length) {
        if (_dataObj.professionals[i]._id === id) {
            found = true;
        } else {
            i++;
        }
    }

    return found ? i : null;
}

function _findReferentInBeneficiary() {
    console.log("_findReferentInBeneficiary", arguments);
    var found = false,
        i = 0;

    if (!_dataObj || !_dataObj.professionals) {
        return null;
    }

    while (!found && i < _dataObj.professionals.length) {
        if (_dataObj.professionals[i].referent === true) {
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
        var oldReferentIdx = _findReferentInBeneficiary();
        if (oldReferentIdx !== null) {
            if (_dataObj.professionals[oldReferentIdx]._id !== currentItem._id) {
                _dataObj.professionals[oldReferentIdx].referent = false;
            }
        }

        var idx = _findProfessionalInBeneficiary(currentItem._id);
        if (idx !== null) {
            //Professional already selected
            _dataObj.professionals[idx].referent = true;
        } else {
            //Professional !already selected
            _dataObj.professionals = _dataObj.professionals || [];
            var newObj = JSON.parse(JSON.stringify(currentItem));
            newObj.referent = true;
            _dataObj.professionals.push(newObj);
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
            var idx = _findProfessionalInBeneficiary(currentItem._id);
            if (idx !== null) {
                //Professional already selected
                if (!node.checked) {
                    //Delete it
                    _dataObj.professionals.splice(idx, 1);
                }
            } else {
                //Professional !already selected
                if (node.checked) {
                    //Add it
                    _dataObj.professionals = _dataObj.professionals || [];
                    var newObj = JSON.parse(JSON.stringify(currentItem));
                    newObj.referent = false;
                    _dataObj.professionals.push(newObj);
                }
            }
        }
    }
}

function checkForm1() {
    var obj = form2js(document.forms["beneficiary"]);
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
            document.forms["beneficiary"]._id = result._id;
        } else {
            alert("error when saving beneficiary");
        }
    }
}

function init() {
    console.log("init");
    document.querySelector("#tsanteListProfessional").addEventListener("tsante-response", onHaveProfessionalsData, false);

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
