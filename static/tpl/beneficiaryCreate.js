"use strict";

var Utils = new Utils();

var _dataObj = null,
    _dataObjTmp = null,
    _dataLists = null,
    _dataAllProfessionnalObj = null,
    _idxNbTelecom = 0,
    _idxNbAddress = 0,
    _langCookie = null,
    _momentFormat = null,
    _currentNodeCalendar = null,
    tsanteListProfessionalElt = null,
	passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*§$£€+-\/\[\]\(\)\{\}\=])[a-zA-Z0-9!@#$%^&*§$£€+-\/\[\]\(\)\{\}\=]{8,}$/;

var modified = false;

function _findProfessionalInBeneficiary(id, obj) {
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
    var items = document.querySelectorAll("form[name='professionals'] .proItemContainer"),
        form = document.querySelector("form[name='professionals']");
    [].map.call(items, function(item) {
        form.removeChild(item);
    });
}

function _addProfessional(professionalItem) {
    var html, div,
        elt = document.querySelector("#tplProfessionnalContainer").innerHTML,
        isFirstItem = true,
        modelData = {
            item: professionalItem,
            display_job: function(){
                var str = professionalItem.job;
                if(_dataLists && _dataLists.job && _dataLists.job.items && 
                    _dataLists.job.items[professionalItem.job] ) {
                    str = _dataLists.job.items[professionalItem.job][_langCookie] || _dataLists.job.items[professionalItem.job]["en"];
                }
                return str;
            },
            display_phone: function() {
                var res = "";
                if (this.system !== "email") {
					var syst = _dataLists.system.items[this.system][_langCookie] || _dataLists.system.items[this.system]["en"];
                    return syst+' '+this.value;
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
	var lang = _langCookie==="en"?"en-gb":_langCookie;
    return moment(strDate, _momentFormat, lang, true).isValid();
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
    _dataObjTmp = null;
    document.querySelector("#addProfessionalsModal").hide();
}

function addProfessionals() {

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
			if( proItem.active ) {
				_addProfessional(proItem);
			}
        });
    }
    closeProfessionals();
}

function deleteProfessional(node) {
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

    if (obj && _dataObj && _dataObj._id) {
        Utils.promiseXHR("POST", "/api/beneficiaries/" + _dataObj._id + "/professionals", 200, JSON.stringify(obj)).then(function() {
            new Modal('updateSuccess');
        }, function(error) {
            new Modal('errorOccured');
            console.log("updateProfessionals - update error: ", error);
        });
    }

}

function checkEntryForm() {
    var formObj = form2js(document.querySelector("form[name='entry']"));

    if (!formObj.entry || !Utils.parseDate(formObj.entry.startDate)) {
        new Modal('errorDateRequired', null, document.querySelector("#startDateError").innerHTML );
        return false;
    }

    if(formObj.entry.plannedEnd) {
        if(!Utils.parseDate(formObj.entry.plannedEnd)) {
            new Modal('errorDateRequired');
            return false;
        }

        if (!formObj.entry || formObj.entry.startDate && formObj.entry.plannedEnd && !_checkIsBeforeDate(formObj.entry.startDate, formObj.entry.plannedEnd)) {
            new Modal('errorDateBefore');
            return false;
        }
    }
    
    if(formObj.entry.endDate) {
        if(!Utils.parseDate(formObj.entry.endDate)) {
            new Modal('errorDateRequired');
            return false;
        }

        if(!formObj.entry || formObj.entry.startDate &&  formObj.entry.endDate && !_checkIsBeforeDate(formObj.entry.startDate, formObj.entry.endDate)) {
            new Modal('errorDateBefore');
            return false;
        }
    }

    return formObj;
}

function checkLifeCondForm() {
    var formObj = form2js(document.querySelector("form[name='life_condition']"));

	/*
    if(!formObj.maritalStatus || formObj.maritalStatus === 'NONE') {
        new Modal('errorNoMaritalStatus');
        return false;
    }
    */
	if( formObj.lifeCond.disability.percent ) {
		formObj.lifeCond.disability.percent = parseInt(formObj.lifeCond.disability.percent, 10);
	}
    return formObj;
}

function checkAccountForm() {
    var formObj = form2js(document.querySelector("form[name='account']"));

    //Check if password are equals
    if ((formObj.checkAccountPassword && !formObj.account) ||
        (formObj.account && formObj.account.password !== formObj.checkAccountPassword)) {

        new Modal('errorConfirmPassword');
        return false;
    }

    if(formObj.account && formObj.account.password !== formObj.password && !passwordRegex.test(formObj.account.password)) {
        new Modal('errorMatchRegexPassword');
        return false;
    }

    if (formObj.account && !formObj.account.login && formObj.account.password) {
        new Modal('errorPasswordNoLogin');
        return false;
    }

    delete formObj.checkAccountPassword;
	delete formObj.password;
	
    if (formObj.telecom) {
        formObj.telecom.system = "email";
    }

    return formObj;
}

function checkProfessionalsForm(backgroundTask) {
    var obj = [];

    if (_dataObj && _dataObj.professionals) {
        _dataObj.professionals.map(function(item) {
            obj.push({
                professionalID: item._id,
                referent: item.referent
            });
        });
    }

    if (!backgroundTask) {
        new Modal('confirmSaveItem', function() {
            updateProfessionals(obj);
        });
    }

    return obj;
}

function checkDiagnosisForm() {
    //Nothing to check
    return form2js(document.querySelector("form[name='diagnosis']"));
}

function updateAll(obj) {
    if (obj._id) {
		if( obj.size === null || obj.size === 0 ) { delete obj.size; }
        Utils.promiseXHR("PUT", "/api/beneficiaries/" + obj._id, 200, JSON.stringify(obj)).then(function() {
			modified = false;
            new Modal('updateSuccess', function() {
				modified = false;
				window.location.href = "/beneficiary/edit/"+obj._id;
			});
        }, function(error) {
			if( error.status === 409 ) {
				new Modal('conflictLogin', function() {
					var login = document.getElementById("login");
					login.scrollIntoView();
					login.style.border = "2px solid red";
					login.focus();
				});
			} else {
				new Modal('errorOccured');
				console.log("updateBeneficiary - update error: ", error);
			}
        });
    }
}

function checkAllForms(isValidate) {
	var id = document.querySelector("form[name='beneficiary'] input[name='_id']").value;
	if( !id ) {
		return checkBeneficiaryForm(false);
	}
    var forms = document.querySelectorAll("form"),
        formsObj = {},
        obj, invalid = false,
        btn;
    //To force the HTML5 form validation on each form if needed, set click on hidden submit button
    //form.submit() doesn't call the HTML5 form validation on elements
    [].map.call(forms, function(form) {
		if( form.name === "account" && !form.login.value ) {
			return;
		}
        if (!form.checkValidity()) {
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
    // console.log("formsObj", formsObj);
    if (isValidate) {
        formsObj.validate = true;
    }

    new Modal('confirmSaveItem', function() {
        updateAll(formsObj);
    });

    return true;
}

function deleteTelecom(node) {
    while (!node.classList.contains("telecomContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function addTelecom() {
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
    while (!node.classList.contains("addressContainer")) {
        node = node.parentNode;
    }
    node.parentNode.removeChild(node);
}

function addAddress() {
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
    if (obj._id) {
		if( obj.size === null || obj.size === 0 ) { delete obj.size; }
        Utils.promiseXHR("PUT", "/api/beneficiaries/" + obj._id, 200, JSON.stringify(obj)).then(function() {
            new Modal('updateSuccess', function() {
                window.location.href = "/beneficiary/overview";
            });
        }, function(error) {
			if( error.status === 409 ) {
				new Modal('conflictLogin');
			} else {
				new Modal('errorOccured');
				console.log("updateBeneficiary - update error: ", error);
			}
        });
    } else {
        Utils.promiseXHR("POST", "/api/beneficiaries", 200, JSON.stringify(obj))
			.then(function(response) {
				_dataObj = JSON.parse(response);
				document.querySelector("form[name='beneficiary'] input[name='_id']").value = _dataObj._id;
				//Enable others panel
				var items = document.querySelectorAll(".waitForId");
				[].map.call(items, function(node) {
					node.removeAttribute("disabled");
				});
				//Display the delete button
				document.querySelector("#deleteBeneficiary").classList.remove("hidden");
				document.querySelector("#hasPersonal").classList.remove("hidden");
				// the created beneficiary is active by default
				document.querySelector("input[name=active]").checked = true;
				activeChange(document.querySelector("input[name=active]"));
				new Modal('createSuccess');
			})
			.catch(function(error) {
				new Modal('errorOccured');
				console.log("updateBeneficiary - create error: ", error);
			});
    }
}

function confirmDeleteBeneficiary() {
    new Modal('confirmDeleteItem', deleteBeneficiary);
}

function deleteBeneficiary() {
    if (_dataObj && _dataObj._id) {
        Utils.promiseXHR("DELETE", "/api/beneficiaries/" + _dataObj._id, 410).then(function(response) {
            new Modal('deleteSuccess', function() {
				modified = false;
                window.history.back();
            });
        }, function(error) {
            new Modal('errorOccured');
            console.log("deleteBeneficiary - error: ", error);
        });
    }
}

function checkBeneficiaryForm(backgroundTask) {
    var obj = form2js(document.querySelector("form[name='beneficiary']"));
	
    if (!_checkDateFormat(obj.birthdate)) {
        new Modal('errorDateRequired');
        return false;
    }

	if( !obj.biomaster ) { obj.biomaster = ""; }
	if( !obj.socialID ) { obj.socialID = ""; }
	/*
    if (isNaN(parseFloat(obj.size))) {
        new Modal('errorSizeNumber');
        return false;
    }
	*/
	
	/*
    if (!obj.address) {
        new Modal('errorNoAddress');
        return false;
    }
    */

	/*
    if (!obj.telecom) {
        new Modal('errorNoTelecom');
        return false;
    }
	*/
	
    if(obj.telecom) {
        var telecomSystemError = false;

        for(var i in obj.telecom) {
            if(!obj.telecom[i].system || obj.telecom[i].system === 'NONE') {
                telecomSystemError = true;
            }
        }

        if(telecomSystemError) {
            new Modal('errorNoTelecomType');
            return;
        }
    }

    //Adjust data before sending
    obj.birthdate = _convertDate(obj.birthdate);
	if( obj.address ) {
		obj.address.map(function (addr) {
			if (addr.line) {
				addr.line = addr.line.split("\n");
			}
		});
	}
	if( obj.size ) {
		obj.size = parseFloat(obj.size) / 100;
	}
    obj.validate = obj.validate === "true" ? true : false;

    if (!backgroundTask) {
        new Modal('confirmSaveItem', function() {
            updateBeneficiary(obj);
        });
    }

    return obj;
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

function activeChange(obj) {
	moment.locale(_langCookie==="en"?"en_gb":_langCookie);
	if( obj.checked === false ) {
		document.querySelector("#diag").removeAttribute("required");
		document.querySelector("#diagLabel").classList.remove("mandatory");
		document.querySelector("input[name=size]").removeAttribute("required");
		document.querySelector("#sizeLabel").classList.remove("mandatory");
		document.querySelector("input[name=biomaster").removeAttribute("required");
		document.querySelector("#biomasterLabel").classList.remove("mandatory");
		document.querySelector("#startDateLabel").classList.remove("mandatory");
		document.querySelector("#startDate").removeAttribute("required");
		var endDate = document.querySelector("#endDate");
		if( !endDate.value ) {
			endDate.value = moment().format("YYYY-MM-DD");
		}
		if( document.querySelector("input[name=size]").value === "0" ) {
			document.querySelector("input[name=size]").value = null;
		}
	} else {
		document.querySelector("input[name=biomaster").setAttribute("required", true);
		if(!document.querySelector("#biomasterLabel").classList.contains("mandatory")) {
			document.querySelector("#biomasterLabel").classList.add("mandatory");
		}
		document.querySelector("#diag").setAttribute("required", true);
		if(!document.querySelector("#diagLabel").classList.contains("mandatory")) {
			document.querySelector("#diagLabel").classList.add("mandatory");
		}
		document.querySelector("input[name=size]").setAttribute("required",true);
		if(!document.querySelector("#sizeLabel").classList.contains("mandatory")) {
			document.querySelector("#sizeLabel").classList.add("mandatory");
		}
		if( !document.querySelector("#startDateLabel").classList.contains("mandatory")) {
			document.querySelector("#startDateLabel").classList.add("mandatory");
		}
		document.querySelector("#startDate").setAttribute("required", true);
		var startDate = document.querySelector("#startDate");
		if( !startDate.value ) {
			startDate.value = moment().format("YYYY-MM-DD");
		}
	}
}

function startChange(evt) {
	var active = document.querySelector("input[name=active]");
	if( evt.target.value && active.checked === false ) {
		active.checked = true;
	}
}

function init() {
    tsanteListProfessionalElt = document.querySelector("#tsanteListProfessional");
    tsanteListProfessionalElt.addEventListener("tsante-response", _onHaveProfessionalsData, false);

	document.addEventListener('change', function( evt ) {
			modified = true;
	}, true );
	
    var promises,
        id = document.querySelector("form[name='beneficiary'] input[name='_id']").value;

    if (id) {
		document.querySelector("#hasPersonal").classList.remove("hidden");
		
        promises = {
            beneficiary: Utils.promiseXHR("GET", "/api/beneficiaries/" + id, 200),
            professionals: Utils.promiseXHR("GET", "/api/beneficiaries/" + id + "/professionals", 200)
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
            new Modal('errorOccured');
            console.log("Init error", error);
        });

    } else {
        //Disable panels except the first until the user save the first one (beneficiary) to get an ID
        var items = document.querySelectorAll(".waitForId");
        [].map.call(items, function(node) {
            node.setAttribute("disabled", true);
        });
        //hide the delete button
        document.querySelector("#deleteBeneficiary").classList.add("hidden");
		// addTelecom();
		// addAddress();
    }

    promises = {
        job: Utils.promiseXHR("GET", "/api/lists/job/array", 200),
        system: Utils.promiseXHR("GET", "/api/lists/system/array", 200)
    };

    var errorCB = function(error){
        new Modal('errorOccured');
        console.log("Init error", error);
    };

    //Used to match the job reference to a friendly user display
    RSVP.hash(promises).then(function(results) {
        try{
            _dataLists = {};
            _dataLists.job = JSON.parse(results.job);
			_dataLists.system = JSON.parse(results.system);
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
    _langCookie = Cookies.get("lang");
	moment.locale(_langCookie==="en"?"en_gb":_langCookie);
    _momentFormat = moment.localeData(_langCookie==="en"?"en_gb":_langCookie).longDateFormat("L");
    [].map.call(document.querySelectorAll(".date"), function(item) {
        item.setAttribute("placeholder", _momentFormat);
    });

    //Set locale to the calendar and add listener for date selection
    var elt = document.querySelector("#calendarModal zdk-calendar");
    elt.setAttribute("i18n", _langCookie);
    elt.addEventListener("select", onHaveDateSelection);
	document.querySelector("#startDate").addEventListener("change",startChange);
}

window.addEventListener("polymer-ready", init, false);

window.addEventListener("beforeunload", function( e) {
	var confirmationMessage;
	if(modified) {
		confirmationMessage = document.querySelector("#unsave").innerHTML;
		(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
		return confirmationMessage;                                //Gecko + Webkit, Safari, Chrome etc.
	}
});

window.addEventListener("DOMContentLoaded", function () {

    var inputTextList = document.querySelectorAll("input[type='text']"),
        inputEmailList = document.querySelectorAll("input[type='email']"),
        textareaList = document.querySelectorAll("textarea"),
		zdkInputDates = document.querySelectorAll("zdk-input-date");

	var i;
	
    for( i=0; i<inputTextList.length; i++) {
        Utils.limitText(inputTextList[i], 100);
    }

    for( i=0; i<inputEmailList.length; i++) {
        Utils.limitText(inputEmailList[i], 100);
    }

    for(  i=0; i<textareaList.length; i++) {
        Utils.limitText(textareaList[i], 500);
    }
	
	[].slice.call(zdkInputDates).forEach( function(elt) {
		elt.setAttribute("i18n",Cookies.get("lang")==="en"?"en_gb":Cookies.get("lang"));
	});
}, false);