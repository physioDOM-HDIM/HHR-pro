"use strict";

var _dataObj = null,
    _accountDataObj = null,
    _useEnum = null,
    _systemEnum = null,
    _roleEnum = null,
    _jobEnum = null,
    _communicationEnum = null,
    _idxNbTelecom = 0;

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

    var inputList = elt.querySelectorAll('input[type="radio"]'),
        inputListLength = inputList.length;

    //Show/Hide relative information to a none organization
    if(isOrganization) {

        for(var i = 0; i<inputListLength; i++) {
            inputList[i].disabled = true;
        }

        elt.className = elt.className + " hidden";
    } else {

        for(var i = 0; i<inputListLength; i++) {
            inputList[i].disabled = false;
        }

        elt.className = "";
    }

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
    while( !node.classList.contains("telecomContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function addTelecom() {
    console.log("addTelecom", arguments);
    var elt = document.querySelector("#tplTelecomContainer").innerHTML;
    var modelData = { indx:++_idxNbTelecom};
    var html = Mustache.render(elt, modelData);
    var div = document.createElement("div");
    div.classList.add("telecomContainer");
    div.innerHTML = html;
    var button = document.querySelector("#addTelecomBtn");
    button.parentNode.insertBefore( div , button );
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
    data.organization = data.organization?true:false;
    
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

function checkPassword () {
    var password = document.querySelector('.account-password'),
        checkPassword = document.querySelector('.account-check-password'),
        accountActivation = document.querySelector('.account-activation');

    if(accountActivation === null) {
        return;
    }

    accountActivation.checked = (password.value === checkPassword.value);

}

function init() {
    console.log("init");
    _idxNbTelecom = document.querySelectorAll(".telecomContainer").length;
    checkOrganization();
}
window.addEventListener("DOMContentLoaded", init, false);
