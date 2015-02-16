"use strict";

function Utils() {

}

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
