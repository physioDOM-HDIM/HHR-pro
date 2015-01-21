"use strict";

function Modal (type, callback) {

    var content = {},
        self = this;

    content.errorOccured = {
        title: "trad_error",
        content: "trad_error_occured",
        buttons: [{
            id: "trad_ok",
            action: function() {
                self.closeModal();
            }
        }]
    };

    content.errorConfirmPassword = {
        title: "trad_errorFormValidation",
        content: "trad_error_password",
        buttons: [{
            id: "trad_ok",
            action: function() {
                self.closeModal();
            }
        }]
    };

    content.errorIncompleteAddress = {
        title: "trad_errorFormValidation",
        content: "trad_incomplete_address",
        buttons: [{
            id: "trad_ok",
            action: function() {
                self.closeModal();
            }
        }]
    }

    content.errorMatchRegexPassword = {
        title: "trad_errorFormValidation",
        content: "trad_error_match_regex_password",
        buttons: [{
            id: "trad_ok",
            action: function() {
                self.closeModal();
            }
        }]
    };

    content.errorEmailRequired = {
        title: "trad_errorFormValidation",
        content: "trad_error_email_required",
        buttons: [{
            id: "trad_ok",
            action: function() {
                self.closeModal();
            }
        }]
    }

    content.createSuccess = {
        title: "trad_create",
        content: "trad_success_create",
        buttons: [{
            id: "trad_ok",
            action: function() {
                if(callback) {
                    callback();
                }
                self.closeModal();
            }
        }]
    };

    content.saveSuccess = {
        title: "trad_create",
        content: "trad_success_saved",
        buttons: [{
            id: "trad_ok",
            action: function() {
                if(callback) {
                    callback();
                }
                self.closeModal();
            }
        }]
    };
    
    content.sendSuccess = {
        title: "trad_send",
        content: "trad_success_send",
        buttons: [{
            id: "trad_ok",
            action: function() {
                if(callback) {
                    callback();
                }
                callback();
            }
        }]
    };

    content.updateSuccess = {
        title: "trad_update",
        content: "trad_success_update",
        buttons: [{
            id: "trad_ok",
            action: function() {
                if(callback) {
                    callback();
                }
                self.closeModal();
            }
        }]
    };

    content.deleteSuccess = {
        title: "trad_delete",
        content: "trad_success_delete",
        buttons: [{
            id: "trad_ok",
            action: function() {
                if(callback) {
                    callback();
                }
                self.closeModal();
            }
        }]
    };

    content.confirmDeleteItem = {
        title: "trad_delete",
        content: "trad_confirm_delete",
        buttons: [{
            id: "trad_yes",
            action: function() {
                callback();
                self.closeModal();
            }
        }, {
            id: "trad_no",
            action: function() {
                self.closeModal();
            }
        }]
    };

    content.confirmUpdateItem = {
        title  : "trad_update",
        content: "trad_confirm_update",
        buttons: [{
            id: "trad_yes",
            action: function() {
                callback();
                self.closeModal();
            }
        }, {
            id: "trad_no",
            action: function() {
                self.closeModal();
            }
        }]
    };

    content.confirmCreateItem = {
        title  : "trad_create",
        content: "trad_confirm_create",
        buttons: [{
            id: "trad_yes",
            action: function() {
                callback();
                self.closeModal();
            }
        }, {
            id: "trad_no",
            action: function() {
                self.closeModal();
            }
        }]
    };

    this.showModal(content[type]);

}

Modal.prototype.closeModal = function() {
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
};

Modal.prototype.showModal = function(modalObj) {
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
};
