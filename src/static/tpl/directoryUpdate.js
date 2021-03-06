"use strict";
/* global Modal, form2js */

/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

var Utils = new Utils();

var _dataObj = null,
    _accountDataObj = null,
    _useEnum = null,
    _systemEnum = null,
    _roleEnum = null,
    _jobEnum = null,
    _communicationEnum = null,
    _idxNbTelecom = 0,
    passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*§$£€+-\/\[\]\(\)\{\}\=])[a-zA-Z0-9!@#$%^&*§$£€+-\/\[\]\(\)\{\}\=]{8,}$/,
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
	var invalid = false, btn, form;
	
	form = document.forms["directoryForm"];
	if (!form.checkValidity()) {
		invalid = true;
		btn = document.querySelector("#createItemBtn") || document.querySelector("#saveItemBtn");
		if (btn) {
			btn.click();
		}
	}

	if (invalid) {
		if( Utils.isSafari() ) {
			var log = "", label = "";
			var elt = document.querySelector("*:required:invalid");
			elt.scrollIntoView();
			if( elt.value ) {
				if (elt.min) {
					log = "the value must be greater than " + elt.min;
				}
				if (elt.max) {
					log = "the value must be lower than " + elt.max;
				}
				if (elt.min && elt.max) {
					log = "the value must be between " + elt.min + " and " + elt.max;
				}
			} else {
				log = "must not be empty";
			}

			if( elt.id && document.querySelector("label[for='"+elt.id+"']")) {
				label = document.querySelector("label[for='"+elt.id+"']").innerHTML;
				log = "<b>The field '"+label+"'</b><br/>" + log;
			}
			new Modal('emptyRequired', null, log);
		}
		return false;
	}
	
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
    if( accountData && !( ( accountData.login || accountData.IDS==="true" ) && accountData.password )) {
        accountData = null;
    }

    if(accountData && (accountData.password === passwordPlaceholder)) {
        accountData.password = accountData.hashPassword;
    }

    data = obj;
	if( data.account ) {
		delete data.account;
	}
	if( accountData && accountData.hashPassword ) {
		delete accountData.hashPassword;
	}

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
		var indx = data.address.line.length - 1;
		var done = false;
		do {
			if( !data.address.line[indx]) {
				data.address.line.splice(indx,1);
			} else {
				done = true;
			}
		} while( --indx > 0 && done === false );
    }
    
    if (data._id) {
		Utils.promiseXHR("PUT", "/api/directory/" + data._id, 200, JSON.stringify(data))
			.then(function(response) {
				if (accountData) {
					Utils.promiseXHR("POST", "/api/directory/" + data._id + "/account", 200, JSON.stringify(accountData))
						.then(function() {
							new Modal('updateSuccess', function() {
								modified = false;
								window.history.back();
							});
						})
						.catch( function(error) {
							var err = JSON.parse(error.responseText);
							var modalType = 'conflictLogin';
							if( err.message.match(/email/i) ) {
								modalType = 'conflictEmail';
							}
							new Modal(modalType, function() {
								if( modalType === 'conflictLogin') {
									var login = document.getElementById("login");
									if( login ) {
										login.scrollIntoView();
										login.style.border = "2px solid red";
										login.focus();
									}
								} else {
									var email = document.querySelector("input[type=email]");
									if (email) {
										email.scrollIntoView();
										email.style.border = "2px solid red";
										email.focus();
									}
								}
							});
						});
				} else {
					new Modal('updateSuccess', function() {
						modified = false;
						window.history.back();
					});
				}
			})
			.catch(function(error) {
				if( error.status === 405 && error.responseText === '{"code":405,"message":"email address already used"}') {
					new Modal('emailAlreadyUsed');
				} else {
					new Modal('errorOccured');
				}
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
				if( error.status === 405 && error.responseText === '{"code":405,"message":"email address already used"}') {
					new Modal('emailAlreadyUsed');
				} else {
					new Modal('errorOccured');
				}
				console.log("updateItem - error: ", error);
			});
    }
}

function confirmDelete() {
	var hasBeneficiary = document.querySelector("div#hasBeneficiary");
	if( hasBeneficiary ) {
		new Modal('confirmDeleteItem', deleteItem, hasBeneficiary.innerHTML );
	} else {
		new Modal('confirmDeleteItem', deleteItem);
	}
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
			var account = JSON.parse( response );
			var OTP = document.querySelector("span#OTP");
			if( OTP ) {
				OTP.innerHTML = account.OTP;
			}
			document.querySelector("button#revokeCert").classList.remove("hidden");
			document.querySelector("button#newCert").classList.remove("hidden");
			document.querySelector("button#createCert").classList.add("hidden");
		}, function(error) {
			new Modal('errorOccured');
			console.log("createCert - error: ", error);
		});
}

function revokeCert() {
	var obj = form2js(document.forms["directoryForm"]);
	Utils.promiseXHR("DELETE", "/api/directory/" + obj._id+ "/cert", 200)
		.then(function(response) {
			console.log( "certRevoke", response );
			var OTP = document.querySelector("span#OTP");
			if( OTP ) {
				OTP.innerHTML = "";
			}
			document.querySelector("button#revokeCert").classList.add("hidden");
			document.querySelector("button#newCert").classList.add("hidden");
			document.querySelector("button#createCert").classList.remove("hidden");
		}, function(error) {
			new Modal('errorOccured');
			console.log("revokeCert - error: ", error);
		});
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
	if( document.querySelector("button#revokeCert") ) {
		document.querySelector("button#revokeCert").addEventListener("click", revokeCert, false);
	}
	if( document.querySelector("button#newCert") ) {
		document.querySelector("button#newCert").addEventListener("click", createCert, false);
	}

    var inputTextList = document.querySelectorAll("input[type='text']"),
        inputEmailList = document.querySelectorAll("input[type='email']"),
        textareaList = document.querySelectorAll("textarea");

    for(var i=0; i<inputTextList.length; i++) {
        Utils.limitText(inputTextList[i], 100);
    }

    for(var i=0; i<inputEmailList.length; i++) {
        Utils.limitText(inputEmailList[i], 100);
    }

    for(var i=0; i<textareaList.length; i++) {
        Utils.limitText(textareaList[i], 500);
    }

	setTimeout(function() {
		if(window.location.pathname === "/directory/create") {
			document.querySelector('.account-password').value = "";
			document.querySelector('.account-check-password').value = "";
			document.querySelector("input[name='address.city']").value = "";
			modified = false;
		}
	},100);
}

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

window.addEventListener("polymer-ready", init, false);
