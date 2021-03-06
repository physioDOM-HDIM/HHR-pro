"use strict";
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

function Utils() {

}

Utils.prototype.isSafari = function() {
	return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
};

/**
 * Promise for XHR with RSVP
 */
Utils.prototype.promiseXHR = function(method, url, statusOK, data) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        var client = new XMLHttpRequest();
        statusOK = statusOK ? statusOK : 200;
        client.open(method, url);
        client.onreadystatechange = function handler() {
            if (this.readyState === this.DONE) {
                if (this.status === statusOK) {
                    resolve(this.response);
                } else {
                    reject(this);
                }
            }
        };
        client.send(data ? data : null);
    });

    return promise;
};

/**
 * return the obj that matches the value of item in args
 */
Utils.prototype.findInObject = function(obj, item, value) {
    var i = 0,
        len = obj.length,
        result = null;

    for(i; i<len; i++) {
        if(obj[i][item] === value) {
            result = obj[i];
            break;
        }
    }

    return result;
};

Utils.prototype.findInObjectCaseInsensitive = function(obj, item, value) {
    var i = 0,
        len = obj.length,
        result = null;

    for(i; i<len; i++) {
        if(obj[i][item].toUpperCase() === value.toUpperCase()) {
            result = obj[i];
            break;
        }
    }

    return result;
};


/**
 * getting Day name from Day Number
 */
Utils.prototype.getDayName = function(day) {
	switch(infos.lang) {
		case "en":
			return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
		case "fr":
			return ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][day];
		case "nl":
			return ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"][day];
		case "es":
			return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][day];
	}
};

/**
 * Parsing string to check if its a date
 */
Utils.prototype.parseDate = function(str) {
    if(!str) {
        return false;
    }

	var match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  	return (match !== null);
};

/**
 * Check if an element as a className passed as arg defined
 */

Utils.prototype.hasClass = function(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
};

/**
 * Remove a class from an element
 */

Utils.prototype.removeClass = function(elt, className) {
    elt.className = elt.className.replace( new RegExp('(?:^|\\s)'+className+'(?!\\S)') ,'');
}

/**
 * Add a class to an element
 */

Utils.prototype.addClass = function(elt, className) {
    elt.className = elt.className + ' ' + className;
}

/**
 * Toggle an element
 */

Utils.prototype.showHideElt = function(elt, className) {
    if(this.hasClass(elt, 'hidden')) {
        elt.className = className;
    } else {
        elt.className = className + ' hidden';
    }
};

/**
 * Hide element
 */

Utils.prototype.hideElt = function(elt) {
    if(!this.hasClass(elt, 'hidden')) {
        elt.className = elt.className + ' hidden';
    }
};

/**
 * Show element
 */

Utils.prototype.showElt = function(elt, className) {
    elt.className = className;
};

/**
 * Check Fields
 */

Utils.prototype.isValid = function(obj) {
    var result = [];

    for(var key in obj) {
        var isValid = (obj[key] !== undefined && obj[key] !== null && obj[key] !== ''),
            field = document.querySelector('.error-'+key);

        this.hideElt(field);
        if(!isValid) {
            this.showElt(field, 'error-'+key);
        }
        result.push(isValid);
    }

    for(field in result) {
        if(!result[field]) {
            return false;
        }
    }

    return true;
}

/**
 * Limit text
 */

Utils.prototype.limitText = function(elt, limitNumber) {

    var eventName;

    if(elt.tagName === 'INPUT') {
        eventName = 'input';
    } else if(elt.tagName === 'TEXTAREA') {
        eventName = 'keyup';
    }

    elt.addEventListener(eventName, function(elt) {

        var elt = elt.target;
        if (elt.value.length > limitNumber) {
            elt.value = elt.value.substring(0, limitNumber);
        }

    }, false);

}

Utils.prototype.lockdown = function() {
    var inputList = [].slice.call(document.querySelectorAll('input')),
        selectList = [].slice.call(document.querySelectorAll('select')),
        textareaList = [].slice.call(document.querySelectorAll('textarea')),
        fieldList = inputList.concat(selectList, textareaList);

    for(var i = 0; i< fieldList.length; i++) {
        fieldList[i].setAttribute('disabled', true);
    }
}

Utils.prototype.lockActions = function() {
    var buttonList = [].slice.call(document.querySelectorAll('button'));

    for(var i = 0; i< buttonList.length; i++) {
        if(!this.hasClass(buttonList[i], 'not-disabled')) {
            buttonList[i].setAttribute('disabled', true); 
        }
    }
}


Utils.prototype.checkInputRange = function(callback) {
    var inputList = document.querySelectorAll('input[type="number"]'),
        valid = true;

    for(var i = 0; i < inputList.length; i++) {
        if(inputList[i].value && inputList[i].getAttribute("min") && inputList[i].getAttribute("max")) {
            var min = parseInt(inputList[i].getAttribute("min")),
                max = parseInt(inputList[i].getAttribute("max")),
                val = parseInt(inputList[i].value);

            if((isNaN(val)) || (min > val) || (max < val)) {
                valid = false;
                break;
            }
        }
        
    }

    callback(valid);
}