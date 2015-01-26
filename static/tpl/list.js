"use strict";

var list,            // the list to edit
    newItems= [],    // new items
    units,           // units list
    jobs,            // job list
    regexRef = /^(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*§$£€+-\?\/\[\]\(\)\{\}\=]{1,}$/;

var Utils = new Utils();

window.addEventListener('DOMContentLoaded', function() {

    Utils.promiseXHR("GET","/api/lists/unity")
        .then( function(response) {
            units = JSON.parse(response);
        })
        .then( function() {
            return Utils.promiseXHR("GET", "/api/lists/job");
        })
        .then( function(response) {
            var listName = document.querySelector('#list-name').innerText;
            jobs = JSON.parse(response);
            return Utils.promiseXHR("GET", "/api/lists/"+listName);
        })
        .then( function(response) {
            list = JSON.parse(response);
            showLang();
        });

}, false);

function showLang() {
    var tpl, prop;

    if(list.measure) {
        tpl = document.querySelector("#tplItemsMeasure").innerHTML;
    } else {
        tpl = document.querySelector("#tplItems").innerHTML;
    }

    var lang = document.querySelector("#lang");
    var modelData = {
        lang: lang.value,
        editable: list.editable,
        service: list.service?list.service:false,
        items: []
    };
    list.items.forEach( function(item, i) {
        var option, obj = { idx:i };
        for(var prop in item ) {
            if( item.hasOwnProperty(prop) ) {
                switch(prop) {
                    case "label" :
                        obj.label = item.label[lang.value];
                        break;
                    case "unity":
                        obj.units = [];
                        units.items.forEach( function(unit) {
                            option = { value: unit.ref, label: unit.label[lang] || unit.label.en  };
                            if( item.unity === unit.ref) {
                                option.selected = true;
                            } else {
                                option.selected = false;
                            }
                            obj.units.push(option);
                        });
                        break;
                    case "roleTypeCode":
                        obj.roles = [];
                        obj.roleTypeCode = "";
                        jobs.items.forEach( function(job) {
                            if( item.roleTypeCode.indexOf(job.ref) !== -1 ) {
                                obj.roleTypeCode += (obj.roleTypeCode.length?", ":"")+( job.label[lang] || job.label.en );
                                obj.roles.push(job.ref);
                            }
                        });
                        break;
                    case "category":
                        if( item.category === "General" ) {
                            obj.general = true;
                        } else {
                            obj.general = false;
                        }
                        break;
                    default:
                        obj[prop] = item[prop];
                }
            }
        }
        if( obj.roles ) { obj.roles = JSON.stringify(obj.roles); }
        modelData.items.push(obj);
    });
    var html = Mustache.render(tpl, modelData);
    document.getElementById("items").innerHTML = html;

    var modelData = {
        lang: lang.value,
        editable: list.editable,
        service: list.service?list.service:false,
        items: []
    };
    newItems.forEach( function(item, i) {
        var option, obj = { idx:i + list.items.length };
        for(var prop in item ) {
            if( item.hasOwnProperty(prop) ) {
                switch(prop) {
                    case "label" :
                        obj.label = item.label[lang.value];
                        break;
                    case "unity":
                        obj.units = [];
                        units.items.forEach( function(unit) {
                            option = { value: unit.ref, label: unit.label[lang] || unit.label.en  };
                            if( item.unity === unit.ref) {
                                option.selected = true;
                            } else {
                                option.selected = false;
                            }
                            obj.units.push(option);
                        });
                        break;
                    case "roleTypeCode":
                        obj.roles = [];
                        obj.roleTypeCode = "";
                        jobs.items.forEach( function(job) {
                            if( item.roleTypeCode.indexOf(job.ref) !== -1 ) {
                                obj.roleTypeCode += (obj.roleTypeCode.length?", ":"")+( job.label[lang] || job.label.en );
                                obj.roles.push(job.ref);
                            }
                        });
                        break;
                    default:
                        obj[prop] = item[prop];
                }
            }
        }
        if( obj.roles ) { obj.roles = JSON.stringify(obj.roles); }
        modelData.items.push(obj);
    });
    var html = Mustache.render(tpl, modelData);
    document.getElementById("newItems").innerHTML = html;
}

function update() {
    var lang = document.querySelector("#lang").value;
    var form = document.querySelector("form[name=items]");
    var obj = form2js(form,null,false);
    var listItem, prop;
    obj.items.forEach( function(item,i) {
        if( item.new ) {
            listItem = newItems[i - list.items.length];
            listItem.ref = item.ref?item.ref:"";
        } else {
            listItem = list.items[i];
        }
        for(var prop in item ) {
            if( item.hasOwnProperty(prop)) {
                switch (prop) {
                    case "ref":
                        break;
                    case "label":
                        if(item.label[lang]) {
                            listItem.label[lang] = item.label[lang];
                        }
                        break;
                    case "threshold":
                    case "range":
                        if (typeof item[prop].min !== 'undefined' && item[prop].min && !isNaN(item[prop].min) ) {
                            listItem[prop].min = parseInt(item[prop].min, 10);
                        } else {
                            item[prop].min = null;
                            listItem[prop].min = null;
                        }
                        if (typeof item[prop].max !== 'undefined' && item[prop].max && !isNaN(item[prop].max)  ) {
                            listItem[prop].max = parseInt(item[prop].max, 10);
                        } else {
                            item[prop].max = null;
                            listItem[prop].max = null;
                        }
                        break;
                    default:
                        if (["active", "autoInput"].indexOf(prop) !== -1) {
                            listItem[prop] = item[prop] ? true : false;
                        } else {
                            listItem[prop] = item[prop];
                        }
                }
            }
        }
    });
}

function addRoles() {
    update();
    var form = document.forms["providers"],
        item,
        obj = form2js(form);

    //transform type (fix of form2js)
    obj.itemnew = (obj.itemnew === 'true');
    obj.itemref = parseInt(obj.itemref);

    item = obj.itemnew ? newItems[obj.itemref - list.items.length] : list.items[obj.itemref];
    item.roleTypeCode = obj.items;
    closeRoles();
    showLang();
}

function closeRoles() {
    document.getElementById("editRole").hide();
}

function editRole(itemref, roles, newItem) {
    var tpl, modal, html,
        lang, modelData;

    modal = document.getElementById("editRole");
    modal.show();
    tpl = document.querySelector("#tplJobs").innerHTML;

    lang = document.querySelector("#lang").value;
    modelData = {
        lang: lang,
        itemref : itemref,
        itemnew: newItem?newItem:false,
        items: []
    };
    jobs.items.forEach( function(item, i) {
        if( item.active ) {
            var obj = {
                idx  : i,
                label: item.label[lang] || item.label.en,
                ref  : item.ref,
                check: roles.indexOf(item.ref) !== -1?true:false
            };
            modelData.items.push(obj);
        }
    });
    html = Mustache.render(tpl, modelData);
    document.querySelector("#editRole .modalContentContainer").innerHTML = html;
}

function save() {
    console.log("save");
    update();

    var error = {};

    newItems.forEach( function(item, i) {
        if( item.ref && regexRef.test(item.ref)) {
            delete item.new;
            delete item.units;
            list.items.push( item );
        } else {
            new Modal('errorMatchRegexRef');
            error.ref = true;
        }
    });

    if(error.ref) {
        return;
    }

    newItems = [];

    Utils.promiseXHR("PUT", "/api/lists/" + list.name, 200, JSON.stringify(list)).then(function(response) {
        new Modal('updateSuccess', showLang);
    }, function(error) {
        new Modal('errorOccured', showLang);
        console.log("updateItem - error: ", error);
    });
}

function deleteItem(obj) {
    while( !obj.classList.contains("item")) {
        obj = obj.parentNode;
    }
    obj.parentNode.removeChild(obj);
}

function valueExists(formName) {
    console.log("valueExists", arguments);
    var res = false,
        values = [],
        items = document.querySelectorAll("form[name='" + formName + "'] input[name*='].ref']");
    [].map.call(items, function(item) {
        if (values.indexOf(item.value) !== -1) {
            res = true;
        } else {
            values.push(item.value);
        }
    });

    return res;
}

function refreshDefaultValue(formName) {
    console.log("refreshDefaultValue", arguments);
    var select = document.querySelector("form[name='" + formName + "'] select[name='defaultValue']"),
        selectedItemValue = select.options[select.selectedIndex].value;
    //Don't delete the first item ('no default value')
    for (var i = select.children.length - 1; i > 0; i--) {
        select.removeChild(select.children[i]);
    }

    var elt,
        items = document.querySelectorAll("form[name='" + formName + "'] input[name*='].ref']");
    [].map.call(items, function(item) {
        elt = document.createElement("option");
        elt.value = item.value;
        //Select the previous selected item
        if (item.value === selectedItemValue) {
            elt.setAttribute("selected", "true");
        }
        elt.innerHTML = elt.value;
        select.appendChild(elt);
    });
}

function addItem(node) {
    console.log("addItem");
    var cn = "hidden",
        isMeasurableItem = false,
        form = node,
        name, tpl, html,
        modelData, obj, newItem;

    var lang = document.querySelector("#lang").value;
    var indx = newItems.length + list.items.length;
    newItem = { ref:"", label:{}, new:true };
    
    modelData = {
        editable: true,
        lang    : lang,
        items   : []
    };
    
    if(list.measure){
        tpl = document.querySelector("#tplItemsMeasure").innerHTML;
        
        obj = {
            idx: indx, 
            new:true,
            ref:"",
            "general":true,
            label:"",
            "unity": "",
            "autoInput": false,
            "threshold": {
                "min": null,
                "max": null
            },
            "range": {
                "min": null,
                "max": null
            },
            units:[]
        };
        units.items.forEach( function(unit) {
            var option = { 
                value: unit.ref, 
                label: unit.label[lang] || unit.label.en,
                selected:false
            };
            obj.units.push(option);
        });
        modelData.items.push(obj);
    }
    else{
        tpl = document.querySelector("#tplItems").innerHTML;
        obj = {
                idx: indx,
                new:true,
                ref:"",
                label: ""
        };
        modelData.items.push(obj);
    }
    newItem = JSON.parse(JSON.stringify(obj));
    delete newItem.idx;
    newItem.label = {};
    newItems.push( newItem );
    if( list.service ) { 
        modelData.service = true; 
        modelData.items[0].roles = "[]";
        modelData.items[0].roleTypeCode = "";
    }
    html = Mustache.render(tpl, modelData);
    var div = document.createElement("div");
    div.innerHTML = html;
    div = div.querySelector("div");
    document.getElementById("newItems").appendChild(div);
    // div.scrollIntoView();
}