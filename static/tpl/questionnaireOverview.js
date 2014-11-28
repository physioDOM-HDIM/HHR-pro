"use strict";

// var promiseXHR = function(method, url, statusOK, data) {
//     var promise = new RSVP.Promise(function(resolve, reject) {
//         var client = new XMLHttpRequest();
//         statusOK = statusOK ? statusOK : 200;
//         client.open(method, url);
//         client.onreadystatechange = function handler() {
//             if (this.readyState === this.DONE) {
//                 if (this.status === statusOK) {
//                     resolve(this.response);
//                 } else {
//                     reject(this);
//                 }
//             }
//         };
//         client.send(data ? data : null);
//     });

//     return promise;
// };

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
        subElt.innerHTML = document.querySelector("#" + modalObj.content).innerHTML + (typeof modalObj.contentAddText !== "undefined" ? " " + modalObj.contentAddText : "");
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

function checkForm(){
    var obj = form2js(document.querySelector("form[name='questionnaire']"));
    console.log("res", obj);

    var a, res = 0, sum = 0;
    for(var i = 0; i<obj.answers.length; i++){
        a = obj.answers[i];
        if(a.choices instanceof Array){
            sum = 0;
            for(var j=0; j<a.choices.length; j++){
                sum += parseFloat(a.choices[j]);
            }
            if(a.subscore){
                sum = eval(a.subscore);
            }
            res += sum;
        }
        else{
            res += parseFloat(a);
        }
    }

    var modalObj = {
        title: "trad_result",
        content: "trad_success_result",
        contentAddText: res,
        buttons: [{
            id: "trad_ok",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}
