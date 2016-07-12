/**
 * @file beneficiaries.js
 * @module Beneficiary
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

//var Person = require("./person.js");
// var Account = require("./account.js");
var promise = require("rsvp").Promise,
  dbPromise = require("./database.js"),
  Logger = require("logger"),
  ObjectID = require("mongodb").ObjectID,
  Beneficiary = require("./beneficiary");

var logger = new Logger("Beneficiaries");

/**
 * Beneficiaries
 *
 * This class allows to manage the Beneficiaries directory
 *
 * @constructor
 */
function Beneficiaries() {

  /**
   * return the list of beneficiaries per page
   * A professional identified by its profID could see only attached beneficiaries
   * A Administrator or coordinator could see every body
   */
  this.getBeneficiaries = function (session, pg, offset, sort, sortDir, filter) {
    logger.trace("getBeneficiaries");

    var search = {}, address = {};
    if (filter) {
      try {
        var tmp = JSON.parse(filter);
        for (var prop in tmp) {
          if (tmp.hasOwnProperty(prop)) {
            switch (prop) {
              case "name":
                search["name.family"] = new RegExp("^" + tmp.name, "i");
                break;
              case "perimeter":
                if (tmp.perimeter !== 'NONE') {
                  search.perimeter = tmp.perimeter;
                }
                break;
              case "zip":
                address.zip = new RegExp("^" + tmp.zip, "i");
                break;
              case "city":
                address.city = new RegExp("^" + tmp.city, "i");
                break;
            }
          }
        }
      } catch (err) {
        search = {};
      }
    }
    if (address.city || address.zip) {
      search.address = {"$elemMatch": address};
    }

    if (session.role) {
      if (["administrator", "coordinator"].indexOf(session.role.toLowerCase()) === -1) {
        search.professionals = {"$elemMatch": {professionalID: session.person.id.toString()}};
        search.active = true;
      }
    } else {
      throw {code: 403, message: "forbidden"};
    }
    var cursor = physioDOM.db.collection("beneficiaries").find(search);
    var cursorSort = {};
    if (sort) {
      cursorSort[sort] = [-1, 1].indexOf(sortDir) !== -1 ? sortDir : 1;
      if (sort !== "name.family") {
        cursorSort["name.family"] = 1;
      }
    } else {
      cursorSort["warning.status"] = -1;
      cursorSort["name.family"] = 1;
    }
    cursor = cursor.sort(cursorSort);
    return dbPromise.getList(cursor, pg, offset);
  };

  this.beneficiariesFilter = function (session, filter) {
    logger.trace("beneficiariesFilter");

    if (session.role) {
      if (["administrator", "coordinator"].indexOf(session.role.toLowerCase()) === -1) {
        filter.professionals = {"$elemMatch": {professionalID: session.person.id.toString()}};
      }
    } else {
      throw {code: 403, message: "forbidden"};
    }
    if (filter['address.city']) {
      filter['address.city'] = new RegExp(filter['address.city'], 'i');
    }
    filter.active = true;
    return physioDOM.db.collection("beneficiaries").find(filter);
  };

  this.getAllActiveHHR = function (pg, offset) {
    var search = {active: true, biomasterStatus: true};
    var cursor = physioDOM.db.collection("beneficiaries").find(search);
    return dbPromise.getArray(cursor);
  };

  this.getAllActiveHHRList = function (pg, offset) {
    logger.trace("getBeneficiaries");

    if (!pg || pg < 1) {
      pg = 1;
    }
    if (!offset) {
      offset = 20;
    }
    var search = {active: true, biomaster: {'$exists': 1, '$ne': ""}};
    var cursor = physioDOM.db.collection("beneficiaries").find(search);
    var cursorSort = {"name.family": 1};
    cursor = cursor.sort(cursorSort);
    return dbPromise.getList(cursor, pg, offset);
  };

  /**
   * Only coordinators or administrators are allowed to create new beneficiary
   */
  this.createBeneficiary = function (session, newBeneficiary) {
    return new promise(function (resolve, reject) {
      logger.trace("createBeneficiary");
      if (!session.role || ["administrator", "coordinator"].indexOf(session.role) === -1) {
        logger.debug("not authorized");
        reject({code: 403, message: "not authorized"});
      } else {
        if (newBeneficiary) {
          var entry = new Beneficiary();
          entry.setup(newBeneficiary)
            .then(function () {
              entry.createEvent("Beneficiary", "create");
            })
            .then(function () {
              resolve(entry);
            })
            .catch(function (err) {
              logger.alert("error ", err);
              console.log(err);
              reject(err);
            });
        } else {
          return reject("Error no entry");
        }
      }
    });
  };

  /**
   * get a beneficiary by its entryID,
   * a professional given by its profID could see only attached beneficiaries
   * @param session
   * @param entryID
   */
  this.getBeneficiaryByID = function (session, entryID) {
    logger.trace("getBeneficiaryByID", entryID);
    var beneficiaryByID = new ObjectID(entryID);
    var beneficiary = new Beneficiary();
    return beneficiary.getById(beneficiaryByID, session.person.item);
  };

  this.getBeneficiaryAdminByID = function (session, entryID) {
    logger.trace("getBeneficiaryAdminByID", entryID);
    var beneficiaryByID = new ObjectID(entryID);
    var beneficiary = new Beneficiary();
    return beneficiary.getAdminById(beneficiaryByID, session.person.item);
  };

  this.getHHR = function (beneficiaryByID) {
    logger.trace("getHHR", beneficiaryByID);
    var beneficiary = new Beneficiary();
    return beneficiary.getHHR(beneficiaryByID);
  };

  /**
   * remove a beneficiary
   *
   * this is exceptional operation only done by admins or coordinators
   *
   * @param beneficiary
   * @param beneficiaryID
   */
  this.deleteBeneficiary = function (beneficiary) {
    function deleteItem(beneficiaryID) {
      return new promise(function (resolve, reject) {
        physioDOM.db.collection("beneficiaries").remove({_id: beneficiaryID}, function (err, nb) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            return resolve(nb);
          }
        });
      });
    }

    function deleteAccount(beneficiaryID) {
      return new promise(function (resolve, reject) {
        physioDOM.db.collection("account").remove({"person.id": beneficiaryID}, function (err, nb) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            return resolve(nb);
          }
        });
      });
    }

    return new promise(function (resolve, reject) {
      logger.trace("deleteBeneficiary", beneficiary._id);
      var beneficiaryID = beneficiary._id;
      deleteItem(beneficiaryID)
        .then(function () {
          return deleteAccount(beneficiaryID);
        })
        .then(resolve)
        .catch(reject);
    });
  };
}

module.exports = Beneficiaries;