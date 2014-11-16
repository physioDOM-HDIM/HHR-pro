"use strict";

var _dataAllProfessionnalObj = null,
    _tmpProfessionalSelected = [{
        item: {
            _id: "53fb2763b3371800000d42ce"
        },
        referent: false
    }, {
        item: {
            _id: "53fb2763b3371800000d42d2"
        },
        referent: true
    }];

function showProfessionals() {
    console.log("showProfessionals");
    //TODO: check the perimeter to filter the url for the listpager
    //var url = document.querySelector("#addProfessionalsModal #tsanteListProfessional") + "?filter={perimeter: xxx}";
    document.querySelector("#addProfessionalsModal #tsanteListProfessional").go();

    document.querySelector("#addProfessionalsModal").show();
}

function saveProfessionals() {
    console.log("saveProfessionals");

    closeProfessionals();
}

function closeProfessionals() {
    console.log("closeProfessionals");
    document.querySelector("#addProfessionalsModal").hide();
}

function onHaveProfessionalsData(data) {
    console.log("onHaveProfessionalsData", data);
    _dataAllProfessionnalObj = data.detail.list;
    if (_dataAllProfessionnalObj && _dataAllProfessionnalObj.items) {
        _dataAllProfessionnalObj.items.map(function(item) {
            var selected = false,
                referent = false,
                proItem,
                i = 0;

            while (!selected && i < _tmpProfessionalSelected.length) {
                proItem = _tmpProfessionalSelected[i];
                if (item._id === proItem.item._id) {
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

        document.querySelector("#tsanteListProfessional template").model = {
            list: _dataAllProfessionnalObj
        };
    }
}

function updateProfessionalReferent(node, idxItem) {
    var oldUpdated = false,
        newUpdated = false,
        existingItem, currentItem,
        i = 0;

    console.log("updateProfessionalReferent", node, _dataAllProfessionnalObj.items[idxItem]);
    console.log("_tmpProfessionalSelected", _tmpProfessionalSelected);
    currentItem = _dataAllProfessionnalObj.items[idxItem];
    while (!oldUpdated && !newUpdated && i < _tmpProfessionalSelected.length) {
        existingItem = _tmpProfessionalSelected[i];
        if (existingItem.referent === true) {
            existingItem.referent = false;
            oldUpdated = true;
        }

        if (existingItem.item._id === currentItem._id) {
            existingItem.referent = true;
            newUpdated = true;
        }
        i++;
    }

    //New selected
    if (!newUpdated) {
        _tmpProfessionalSelected.push({
            item: currentItem,
            referent: true
        });
    }

    //if it's a referent, it's automatically selected
    node.parentNode.querySelector("input[type='checkbox']").checked = true;
}

function updateProfessionalSelection(node, idxItem) {
    var found = false,
        existingItem, currentItem,
        i = 0;

    console.log("updateProfessionalSelection", node, _dataAllProfessionnalObj.items[idxItem]);
    console.log("_tmpProfessionalSelected", _tmpProfessionalSelected);
    currentItem = _dataAllProfessionnalObj.items[idxItem];
    while (!found && i < _tmpProfessionalSelected.length) {
        existingItem = _tmpProfessionalSelected[i];
        if (existingItem.item._id === currentItem._id) {
            if (!existingItem.referent) {
                _tmpProfessionalSelected.splice(i, 1);
            }
            else{
                node.checked = true; //can't unselect if it's a referent
            }
            found = true;
        }
        i++;
    }

    //New selected
    if (!found) {
        _tmpProfessionalSelected.push({
            item: currentItem
        });
    }

}

function checkForm1() {
    var obj = form2js(document.forms["beneficiary"]);
    console.log(obj);
    if( isNaN(parseFloat(obj.size)) ) {
        alert("size must be a number");
    } else {
        obj.size = parseFloat(obj.size);
    }
    obj.validate = obj.validate==="true"?true:false;
    obj.address[0].line = obj.address[0].line.split("\n");
    if( !obj.telecom[0].value ) { delete obj.telecom; }
    var xhr = new XMLHttpRequest();
    if( obj._id) {
        xhr.open("PUT","/api/beneficiaries/"+obj._id, false);
        xhr.send(JSON.stringify(obj));
        if(xhr.status === 200 ) {
            alert("beneficiary saved");
        } else {
            alert("error when saving beneficiary");
        }
    } else {
        xhr.open("POST","/api/beneficiaries",false);
        xhr.send(JSON.stringify(obj));
        if(xhr.status === 200 ) {
            alert("beneficiary saved");
            var result = JSON.parse(xhr.responseText);
            document.forms["beneficiary"]._id = result._id;
        } else {
            alert("error when saving beneficiary");
        }
    }
}
