"use strict";

function showProfessionals(){
    document.querySelector("#addProfessionalsModal #tsanteList").go();
    document.querySelector("#addProfessionalsModal").show();
}

function closeProfessionals(){
    document.querySelector("#addProfessionalsModal").hide();
}

function init() {

}

window.addEventListener("DOMContentLoaded", init, false);
