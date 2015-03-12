"use strict";
/* global Modal, form2js */

var Utils = new Utils();

var _dataObj = null,
    _accountDataObj = null,
    _useEnum = null,
    _systemEnum = null,
    _roleEnum = null,
    _jobEnum = null,
    _communicationEnum = null,
    _idxNbTelecom = 0,
    passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*§$£€+-\?\/\[\]\(\)\{\}\=])[a-zA-Z0-9!@#$%^&*§$£€+-\?\/\[\]\(\)\{\}\=]{8,}$/,
    passwordPlaceholder = '****',
	modified = false;

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
    var i, elt1 = document.querySelector("#nonOrgContainer"),
		elt2 = document.querySelector("#OrgContainer"),
        isOrganization = document.querySelector("form[name=directoryForm] input[name='organization']").checked;

    var inputList = elt1.querySelectorAll('input[type="radio"]'),
        inputListLength = inputList.length;

    //Show/Hide relative information to a none organization
    if(isOrganization) {
        for( i = 0; i<inputListLength; i++) {
            inputList[i].disabled = true;
        }
		elt2.querySelector("select").disabled = false;
		elt2.classList.remove("hidden");
        elt1.classList.add("hidden");
    } else {
        for( i = 0; i<inputListLength; i++) {
            inputList[i].disabled = false;
        }
		elt2.querySelector("select").disabled = true;
		elt2.classList.add("hidden");
		elt1.classList.remove("hidden");
    }

    //Firefox fix: set default value for this required input due to validation form even if the node is hidden or the required attribute removed
    var elt = document.querySelector("form[name=directoryForm] input[name='name.given']");
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
    var obj;

    function isEmailSet() {
        var isEmail = false,
            systemElt, valueElt;

        if(!obj.telecom) {
            return false;
        }

        obj.telecom.forEach( function( item ) {
            if( item.system === "email" && item.value !== "") {
                isEmail = true;
            }
        });
        return isEmail;
    }

    obj = form2js(document.forms["directoryForm"]);
    console.log(obj);

    if(obj.account && (obj.account.password || obj.checkAccountPassword) && (obj.account.password !== passwordPlaceholder || obj.checkAccountPassword !== passwordPlaceholder)) {
        if( obj.account && obj.account.password !== obj.checkAccountPassword) {
            new Modal('errorConfirmPassword');
            return;
        }

        if(!passwordRegex.test(obj.account.password)) {
            new Modal('errorMatchRegexPassword');
            return;
        }
    }

    if (!isEmailSet()) {
        new Modal('errorEmailRequired');
        return;
    }

    if(obj.address.line || obj.address.city || obj.address.zip) {
        if(!(obj.address.line && obj.address.city && obj.address.zip)) {
            new Modal('errorIncompleteAddress');
            return;
        }
    }

    if (obj._id) {
        new Modal('confirmUpdateItem', function() {
            updateItem(obj);
        });
    } else {
        new Modal('confirmCreateItem', function() {
            updateItem(obj);
        });
    }
}

function deleteTelecom(node) {
    console.log("deleteTelecom", arguments);
    while( !node.classList.contains("telecomContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
	modified = true;
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

    var data, accountData;
    // remove uneeded fields
    delete obj.checkAccountPassword;  // move to check
    accountData = obj.account?obj.account:null;
    if( accountData && !( accountData.login && accountData.password )) {
        accountData = null;
    }

    if(accountData && (accountData.password === passwordPlaceholder)) {
        accountData = null;
    }

    data = obj;
    delete data.account;
    data.active = data.active?true:false;
    data.organization = data.organization?true:false;
    if( !data.organization ) {
		delete data.organizationType;
	} else {
		delete data.job;
	}
	
    // check address
    if( !(data.address.line && data.address.zip && data.address.city) ) {
        delete data.address;
    } else {
        data.address.line = data.address.line.split("\n");
    }
    
    if (data._id) {
        //Update entry
        var tabPromises = [Utils.promiseXHR("PUT", "/api/directory/" + data._id, 200, JSON.stringify(data))];

        if (accountData) {
            tabPromises.push(Utils.promiseXHR("POST", "/api/directory/" + data._id + "/account", 200, JSON.stringify(accountData)));
        }

        RSVP.all(tabPromises).then(function() {
            new Modal('updateSuccess', function() {
				modified = false;
                window.history.back();
            });
        }).catch(function(error) {
            new Modal('errorOccured');
            console.log("updateItem - error: ", error);
        });
    } else {
        var callSuccess = function() {
            new Modal('createSuccess', function() {
				modified = false;
                window.history.back();
            });
        };

        Utils.promiseXHR("POST", "/api/directory", 200, JSON.stringify(data))
			.then(function(response) {
				var res = JSON.parse(response);
				return res._id;
			}).then(function(userID) {
				if (accountData && userID) {
					Utils.promiseXHR("POST", "/api/directory/" + userID + "/account", 200, JSON.stringify(accountData)).then(function() {
						callSuccess();
					});
				} else {
					callSuccess();
				}
			}).catch(function(error) {
				new Modal('errorOccured');
				console.log("updateItem - error: ", error);
			});
    }
}

function confirmDelete() {
    new Modal('confirmDeleteItem', deleteItem);
}

function deleteItem() {
    console.log("deleteItem");

    var obj = form2js(document.forms["directoryForm"]);
    if (obj._id) {
        Utils.promiseXHR("DELETE", "/api/directory/" + obj._id, 410).then(function(response) {
            new Modal('deleteSuccess', function() {
                window.history.back();
            });
        }, function(error) {
            new Modal('errorOccured');
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

    accountActivation.checked = (password.value === checkPassword.value && passwordRegex.test(checkPassword.value));
}

function createCert() {
	var obj = form2js(document.forms["directoryForm"]);
	Utils.promiseXHR("GET", "/api/directory/" + obj._id+ "/cert", 200)
		.then(function(response) {
			console.log( "certCreate", response );
		}, function(error) {
			new Modal('errorOccured');
			console.log("createCert - error: ", error);
		});
}

function revoqCert() {
	
}

function init() {
    console.log("init");
	
	document.addEventListener('change', function( evt ) {
		modified = true;
	}, true );
	
    _idxNbTelecom = document.querySelectorAll(".telecomContainer").length;
    var hasPassword = (document.querySelector('#has-password').innerHTML === 'true');
	
    if(hasPassword) {
        document.querySelector('.account-password').value = passwordPlaceholder;
        document.querySelector('.account-check-password').value = passwordPlaceholder;
    }
	if( document.querySelector("button#createCert") ) {
		document.querySelector("button#createCert").addEventListener("click", createCert, false);
	}
}

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

window.addEventListener("DOMContentLoaded", init, false);
