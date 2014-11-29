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

    closeModal();
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

    var sum = 0;
    var compute = function(tab){
        var item, tmp, res = 0;
        for(var i=0; i<tab.length; i++){
            item = tab[i];
            if(item.answers){
                sum += compute(item.answers);
                if(item.subscore){
                    sum = eval(item.subscore);
                }
                tmp = parseFloat(sum);
                if(!isNaN(tmp)){
                    res += parseFloat(tmp);
                }
                sum = 0;
            }
            else{
                tmp = parseFloat(item.choice);
                if(!isNaN(tmp)){
                    res += tmp;
                }
            }
        }

        return res;
    };

    var res = compute(obj.answers);
    obj.globalScore = parseFloat(res);
    //TODO : utiliser le parseFloat sur l'obj retourné par form2js, car se sont des strings
    //Ajouter les propriétés necessaire et envoyer l'object au server pour sauvegarde dans la base

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
