"use strict";

var utils = new Utils(),
    infos = {},
    idx = 0,
    createdDataRecordID = null,
    lists = {};

infos.datasInit = null;

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

/* UI Actions */

function getCategoryParam(category) {
    var list = null;

    switch(category) {
    case 'General':
        list = lists.parameters;
        break;
    case 'HDIM':
        list = lists.parameters;
        break;
    case 'symptom':
        list = lists.symptom;
        break;
    case 'questionnaire':
        list = lists.questionnaire;
        break;
    }

    return list;
}

function addLine(category) {
    var tpl = document.getElementById('newItem'),
        container = document.getElementById('newItems-'+category),
        newLine = document.createElement('div'),
        selectParamTpl = document.getElementById('selectParam').innerHTML;

    //add index to line for form2js formating
    var modelData = {
            idx: ++idx,
            lists: getCategoryParam(category),
            questionnaire: (category === 'questionnaire')
        };

    newLine.innerHTML = tpl.innerHTML;
    newLine.className = 'questionnaire-row';

    newLine.querySelector('.item-text').innerHTML = selectParamTpl;

    var html = Mustache.render(newLine.innerHTML, modelData);
    newLine.innerHTML = html;

    if (category === 'questionnaire') {
        newLine.querySelector('.questionnaire-button-container a.button').addEventListener('click', onQuestionnaireButtonClick);
    }

    var allSelectedOptions = container.parentNode.parentNode.querySelectorAll('.item-text select option:checked');
    var newLineOptions = newLine.querySelectorAll('.item-text select option');

    var i, j;
    for (i = 0; i < allSelectedOptions.length; i++) {
        for (j = 0; j < newLineOptions.length; j++) {
            if (allSelectedOptions[i].value === newLineOptions[j].value && newLineOptions[j].value !== '') {
                newLineOptions[j].disabled= true;
            }
        }
    }

    container.appendChild(newLine);

    var contentField = newLine.querySelector('.questionnaire-comment');

    if(contentField) {
        contentField.onkeyup = function () {
            console.log('toto');
            var lines = contentField.value.split("\n");
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].length <= 60) { continue; }
                var j = 0, space = 60;
                while (j++ <= 60) {
                    if (lines[i].charAt(j) === " ") { space = j; }
                }
                lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");
                lines[i] = lines[i].substring(0, space);
            }
            contentField.value = lines.slice(0, 9).join("\n");
        };
    }

}

function removeLine(element) {
    var line = element.parentNode.parentNode.parentNode,
        container = line.parentNode;

    container.removeChild(line);

    // Enable the selected option on other rows

    var allSelectedOptions = container.parentNode.parentNode.querySelectorAll('.item-text select option:checked');
    var allOptions = container.parentNode.parentNode.querySelectorAll('.item-text select option');

    var i, j;
    for (i = 0; i < allOptions.length; i++) {
        allOptions[i].disabled = false;
        for (j = 0; j < allSelectedOptions.length; j++) {
            if (allOptions[i] !== allSelectedOptions[j] &&
                allSelectedOptions[j].value === allOptions[i].value &&
                allOptions[i].value !== '') {
                allOptions[i].disabled = true;
                break;
            }
        }
    }
}

function removeItem(id) {
    var item = document.getElementById('ID' + id),
        container = item.parentNode;

    container.removeChild(item);
}

/* Form Valid */
function update(dataRecordID) {
    var obj = form2js(document.forms.dataRecord);

    if(JSON.stringify(obj) !== "{}") {

        var i=0,
        data = obj.items,
        len = data.length,
        origin = infos.datasInit.items;

        for(i; i<len; i++) {
            //Bool and float convertion
            data[i].value = parseFloat(data[i].value);
            data[i].automatic = (data[i].automatic === "true");

            if(origin && origin[i]) {
                origin[i].value = parseFloat(origin[i].value);
                origin[i].automatic = (origin[i].automatic === "true");

                //check if change has been done, if so set automatic field to false
                if(origin[i].value !== data[i].value || origin[i].text !== data[i].text) {
                    data[i].automatic = false;
                }
            }

        }

        utils.promiseXHR("PUT", "/api/beneficiary/datarecords/"+dataRecordID, 200, JSON.stringify(data)).then(function(response) {
            updateSuccess();
        }, function(error) {
            errorOccured();
            console.log("saveForm - error: ", error);
        });

    } else {
        errorOccured();
    }
}

function create() {

    if(createdDataRecordID !== null) {
        update(createdDataRecordID);
    } else {
        var obj = form2js(document.forms.dataRecord);

        if(JSON.stringify(obj) !== "{}") {

            var i=0,
            len = obj.items.length;

            for(i; i<len; i++) {
                //Bool and float convertion
                // if(obj.items[i].category !== "questionnaire")
                obj.items[i].value = parseFloat(obj.items[i].value);
                obj.items[i].automatic = false;
            }

            console.log("res", obj);
            utils.promiseXHR("POST", "/api/beneficiary/datarecord", 200, JSON.stringify(obj)).then(function(response) {
                createSuccess();
                var record = JSON.parse(response);
                createdDataRecordID = record._id;
            }, function(error) {
                errorOccured();
                console.log("saveForm - error: ", error);
            });

        } else {
            errorOccured();
        }
    }

}

window.addEventListener("DOMContentLoaded", function() {
    infos.datasInit = form2js(document.forms.dataRecord);
    infos.lang = document.getElementById('lang').textContent;
    getLists();
}, false);


function getLists() {

    var promises = {
            parameters: utils.promiseXHR("GET", "/api/lists/parameters", 200),
            symptom: utils.promiseXHR("GET", "/api/lists/symptom", 200),
            questionnaire: utils.promiseXHR("GET", "/api/lists/questionnaire", 200),
            unity: utils.promiseXHR("GET", "/api/lists/unity", 200)
        };

    RSVP.hash(promises).then(function(results) {
        function filterActive(element) {
            return element.active;
        } 
        
        lists.parameters = JSON.parse(results.parameters).items.filter(filterActive);
        lists.symptom = JSON.parse(results.symptom).items.filter(filterActive);
        lists.questionnaire = JSON.parse(results.questionnaire).items.filter(filterActive);

        var unityList = JSON.parse(results.unity).items;

        var i = 0,
            leni = lists.parameters.length;

        for(i; i<leni; i++) {
            var y = 0,
                leny = unityList.length;

            for(y; y<leny; y++) {
                if(lists.parameters[i].unity === unityList[y].ref) {
                    lists.parameters[i].unityLabel = unityList[y].label[infos.lang];
                    break;
                }
            }
        }
        setLang();
        initParams();

    });

}

function setLang() {
    var i, len;

    for (i = 0, len = lists.parameters.length; i < len; i++) {
        lists.parameters[i].labelLang = lists.parameters[i].label[infos.lang];
    }
    for (i = 0, len = lists.symptom.length; i < len; i++) {
        lists.symptom[i].labelLang = lists.symptom[i].label[infos.lang];
    }
    for (i = 0, len = lists.questionnaire.length; i < len; i++) {
        lists.questionnaire[i].labelLang = lists.questionnaire[i].label[infos.lang];
    }
}

function initParams() {
    var lines = document.querySelectorAll('.line'),
        i = 0,
        len = lines.length;

    var selectParamTpl = document.getElementById('selectParam').innerHTML;

    for(i; i<len; i++) {

        var _id = lines[i].id.substring(2),
            category = lines[i].querySelector('.category').textContent,
            categoryContainer = lines[i].querySelector('.item-category');

        var type = lines[i].querySelector('.type').textContent,
            item = utils.findInObject(getCategoryParam(category), 'ref', type),
            modelDataSelect = {
                lists: getCategoryParam(category),
                selection: function () {
                    return function(val, render) {
                        if(item.ref === render(val)) {
                            return 'selected';
                        }
                    };
                },
                id: _id
            },
            modelDataLine = {item: item};

        var selectHTML = Mustache.render(selectParamTpl, modelDataSelect),
            lineHTML = Mustache.render(lines[i].innerHTML, modelDataLine);

        lines[i].innerHTML = lineHTML;
        lines[i].querySelector('.item-text').innerHTML = selectHTML;

        if(categoryContainer) {
            if(item.category) {
                categoryContainer.value = item.category;
            } else {
                categoryContainer.value = category;
            }
        }
    }
}

var updateParam = function(element, directValue) {
    var container = element.parentNode.parentNode.parentNode,
        select = container.querySelector('select'),
        minContainer = container.querySelector('.min-treshold'),
        maxContainer = container.querySelector('.max-treshold'),
        unityContainer = container.querySelector('.unity'),
        categoryContainer = container.querySelector('.item-category');

    if(!directValue) {
        if(element.value !== undefined && element.value !== '') {
            var elt = element.value;
        }
    } else {
        var elt = directValue;
        select.value = elt;
    }

    //get chosen param
    var category = container.parentNode.parentNode.querySelector('.category').textContent;
    var param = utils.findInObject(getCategoryParam(category), 'ref', elt);

    //for create
    var newItemCategory = container.querySelector('#new-item-category');
    if (newItemCategory) {
        if (param && param.category) {
            newItemCategory.value = param.category;
        }
        else {
            newItemCategory.value = category;
        }
    }
    //for update
    if (categoryContainer) {
        if(param && param.category) {
            categoryContainer.value = param.category;
        }
        else {
            categoryContainer.value = category;
        }
    }


    if (elt && category !== 'symptom' && category !== 'questionnaire') {

        minContainer.innerHTML = param.threshold.min? param.threshold.min: '-';
        maxContainer.innerHTML = param.threshold.max? param.threshold.max: '-';
        unityContainer.innerHTML = param.unityLabel? param.unityLabel: '';
    }
    else if (category === 'questionnaire') {
        // Questionnaire item
        container.setAttribute('data-name', select.value);
        if (select.value) {
            container.querySelector('.questionnaire-button-container a.button').setAttribute('href', '/questionnaire/' + select.value);
            container.querySelector('.questionnaire-button-container a.button').classList.remove('disabled');
        }
        else {
            container.querySelector('.questionnaire-button-container a.button').classList.add('disabled');
        }
    }
    else {
        minContainer.innerHTML = '-';
        maxContainer.innerHTML = '-';
        unityContainer.innerHTML = '';
    }

    // Disable the selected option on other rows

    var allSelectedOptions = container.parentNode.parentNode.parentNode.querySelectorAll('.item-text select option:checked');
    var allOptions = container.parentNode.parentNode.parentNode.querySelectorAll('.item-text select option');

    var i, j;
    for (i = 0; i < allOptions.length; i++) {
        allOptions[i].disabled = false;
        for (j = 0; j < allSelectedOptions.length; j++) {
            if (allOptions[i] !== allSelectedOptions[j] &&
                allSelectedOptions[j].value === allOptions[i].value &&
                allOptions[i].value !== '') {
                allOptions[i].disabled = true;
                break;
            }
        }
    }
};

function toggleEditMode(id) {
    var line = document.getElementById('ID' + id),
        updateMode = line.querySelector('.updateMode'),
        readMode = line.querySelector('.readMode'),
        paramSelect = updateMode.querySelector('select'),
        paramValue = line.querySelector('.type').textContent;

    updateParam(paramSelect, paramValue);

    if (hasClass(updateMode, 'hidden')) {
        updateMode.className = 'updateMode';
        readMode.className = 'readMode hidden';
    } else {
        updateMode.className = 'updateMode hidden';
        readMode.className = 'readMode';
    }
}




/* Modal */

function closeModal() {
    console.log("closeModal", arguments);
    document.getElementById('statusModal').hide();

    var elt = document.getElementById('statusModal'),
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

    var elt = document.getElementById("statusModal"),
        subElt;
    if (modalObj.title) {
        subElt = elt.querySelector(".modalTitleContainer");
        subElt.innerHTML = document.getElementById(modalObj.title).innerHTML;
        subElt.classList.remove("hidden");
    }
    if (modalObj.content) {
        subElt = elt.querySelector(".modalContentContainer");
        subElt.innerHTML = document.getElementById(modalObj.content).innerHTML;
        subElt.classList.remove("hidden");
    }

    if (modalObj.buttons) {
        var btn, obj, color;
        subElt = elt.querySelector(".modalButtonContainer");
        for (var i = 0; i < modalObj.buttons.length; i++) {
            obj = modalObj.buttons[i];
            btn = document.createElement("button");
            btn.innerHTML = document.getElementById(obj.id).innerHTML;
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

    document.getElementById("statusModal").show();
}

function confirmDeleteItem(id) {
    var modalObj = {
        title: "trad_delete",
        content: "trad_confirm_delete",
        buttons: [{
            id: "trad_yes",
            action: function() {
                removeItem(id);
                closeModal();
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

function errorOccured() {
    var modalObj = {
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
}

function createSuccess() {
    var modalObj = {
        title: "trad_create",
        content: "trad_success_create",
        buttons: [{
            id: "trad_ok",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}

function updateSuccess() {
    var modalObj = {
        title: "trad_update",
        content: "trad_success_update",
        buttons: [{
            id: "trad_ok",
            action: function() {
                closeModal();
            }
        }]
    };
    showModal(modalObj);
}
