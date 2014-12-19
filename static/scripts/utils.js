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
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][day];
};