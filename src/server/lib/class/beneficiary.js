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

/**
 * @file beneficiary.js
 * @module Beneficiary
 */

/* jslint node:true */
/* global physioDOM */
/* global -Promise */
"use strict";

var RSVP = require("rsvp"),
  Promise = require("rsvp").Promise,
  Logger = require("logger"),
  ObjectID = require("mongodb").ObjectID,
  beneficiarySchema = require("./../schema/beneficiarySchema"),
  DataRecord = require("./dataRecord"),
  Messages = require("./messages"),
  DataProg = require("./dataProg"),
  DataProgItem = require("./dataProgItem"),
  QuestionnairePlan = require("./questionnairePlan"),
  DietaryPlan = require("./dietaryPlan"),
  PhysicalPlan = require("./physicalPlan"),
  Events = require("./events"),
  dbPromise = require("./database"),
  Queue = require("./queue.js"),
  Symptoms = require("./symptoms.js"),
  moment = require("moment"),
  md5 = require('md5'),
  soap = require("soap"),
  Services = require("./services"),
  Cookies = require("cookies");

var logger = new Logger("Beneficiary");

function capitalize(str) {
  return str.replace(/(^|\s)([a-z])/g, function (m, p1, p2) {
    return p1 + p2.toUpperCase();
  });
}

/**
 * Manage a beneficiary record
 *
 * @constructor
 */
function Beneficiary() {

  /**
   * Get a beneficiary in the database known by its ID
   *
   * on success the Promise returns the beneficiary record,
   * else return an error ( code 404 )
   *
   * @param beneficiaryID
   * @param professional
   * @returns {Promise}
   */
  this.getById = function (beneficiaryID, professional) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getById", beneficiaryID);
      var search = {_id: beneficiaryID};
      if (["administrator", "coordinator"].indexOf(professional.role) === -1 && beneficiaryID.toString() !== professional._id.toString()) {
        search.professionals = {'$elemMatch': {professionalID: professional._id.toString()}};
      }
      physioDOM.db.collection("beneficiaries").findOne(search, function (err, doc) {
        if (err) {
          logger.alert("Error");
          throw err;
        }
        if (!doc) {
          reject({code: 404, error: "beneficiary not found"});
        } else {
          for (var prop in doc) {
            if (doc.hasOwnProperty(prop)) {
              that[prop] = doc[prop];
            }
          }
          if (!that.address) {
            that.address = [{use: "home"}];
          }
          if (!that.telecom) {
            that.telecom = [{system: "phone"}];
          }
          resolve(that);
        }
      });
    });
  };

  this.services = function () {
    return new Services(this);
  };

  /**
   * Get a beneficiary known by its ID : `beneficiaryID`
   *
   * This method is used to create or modify a beneficiary
   * the professional must be an administrator or a coordinator
   *
   * if beneficiaryID is null the Promise return an empty structure
   *
   * @param beneficiaryID
   * @param professional
   * @returns {Promise}
   */
  this.getAdminById = function (beneficiaryID, professional) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getAdminById", beneficiaryID);
      var result = {telecom: [{system: "phone"}], address: [{use: "home"}]};
      that.getById(beneficiaryID, professional)
        .then(function (beneficiary) {
          result = beneficiary;
          return beneficiary.getAccount();
        })
        .then(function (account) {
          result.account = account;
          resolve(result);
        })
        .catch(function (err) {
          logger.warning("error", err);
          resolve(result);
        });
    });
  };

  /**
   * Get a beneficiary in the database known by its ID
   * this method is only used by the Queue API
   *
   * on success the Promise returns the beneficiary record,
   * else return an error ( code 404 )
   *
   * @param beneficiaryID
   * @param professional
   * @returns {Promise}
   */
  this.getHHR = function (beneficiaryID) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getHHR", beneficiaryID);
      var search = {_id: beneficiaryID};

      physioDOM.db.collection("beneficiaries").findOne(search, function (err, doc) {
        if (err) {
          logger.alert("Error");
          throw err;
        }
        if (!doc) {
          reject({code: 404, error: "beneficiary not found"});
        } else {
          for (var prop in doc) {
            if (doc.hasOwnProperty(prop)) {
              that[prop] = doc[prop];
            }
          }
          if (!that.address) {
            that.address = [{use: "home"}];
          }
          if (!that.telecom) {
            that.telecom = [{system: "phone"}];
          }
          resolve(that);
        }
      });
    });
  };

  /**
   * return account information about the beneficiary
   *
   * the Promise resolve with account information as object,
   * if no account information is found the resolve return an empty object
   *
   * @returns {Promise}
   */
  this.getAccount = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
      var search = {"person.id": that._id, "role": "beneficiary"};
      physioDOM.db.collection("account").findOne(search, function (err, item) {
        if (err) {
          throw err;
        } else {
          resolve(item || {});
        }
      });
    });
  };

  /**
   * save the beneficiary in the database
   *
   * the Promise return the beneficiary object completed with the `_id` for a new record
   *
   * @returns {Promise}
   */
  this.save = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("-> save");

      if (!that.warning) {
        that.warning = {
          status: false,
          source: null,
          date  : null
        };
      }
      physioDOM.db.collection("beneficiaries").save(that, function (err, result) {
        if (err) {
          throw err;
        }
        if (isNaN(result)) {
          that._id = result._id;
        }
        resolve(that);
      });
    });
  };

  /**
   * Check that there's no beneficiary already exists with the same
   *  name, birthdate and telecom
   *
   * @todo set a regexp case insensitive for the name
   *
   * @param entry
   * @returns {Promise}
   */
  function checkUniq(entry) {
    return new Promise(function (resolve, reject) {
      logger.trace("checkUniq");
      // check that the entry have an email

      var filter = {name: entry.name, birthdate: entry.birthdate, telecom: entry.telecom};
      if (entry._id) {
        filter._id = {"$ne": new ObjectID(entry._id)};
      }
      physioDOM.db.collection("beneficiaries").count(filter, function (err, nb) {
        if (err) {
          logger.error(err);
          reject(err);
        }
        if (nb > 0) {
          logger.warning("duplicate");
          reject({error: "duplicate"});
        } else {
          resolve(entry);
        }
      });
    });
  }

  /**
   * Check the schema of a beneficiary record
   *
   * @param entry
   * @returns {Promise}
   */
  function checkSchema(entry) {
    return new Promise(function (resolve, reject) {
      logger.trace("checkSchema");
      var check = beneficiarySchema.validator.validate(entry, {"$ref": "/Beneficiary"});
      if (check.errors.length) {
        return reject({error: "bad format", detail: check.errors});
      } else {
        return resolve(entry);
      }
    });
  }

  /**
   * initialize a beneficiary with the object `newEntry`
   *
   * the Promise return on success the beneficiary record
   *
   * @param newEntry
   * @returns {Promise}
   */
  this.setup = function (newEntry) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("setup");
      checkSchema(newEntry)
        .then(checkUniq)
        .then(function (entry) {
          for (var key in newEntry) {
            if (newEntry.hasOwnProperty(key)) {
              switch (key) {
                case "name":
                  that.name = newEntry.name;
                  if (that.name.family) {
                    that.name.family = capitalize(that.name.family);
                  }
                  if (that.name.given) {
                    that.name.given = capitalize(that.name.given);
                  }
                  break;
                case "address":
                  that.address = newEntry.address;
                  that.address.forEach(function (address) {
                    address.city = address.city.toUpperCase();
                  });
                  break;
                default:
                  that[key] = newEntry[key];
              }
            }
          }
          return that.save();
        })
        .then(resolve)
        .catch(function (err) {
          logger.error(err);
          reject(err);
        });
    });
  };

  this.getEmail = function () {
    var email = "";
    this.telecom.forEach(function (item) {
      if (!email && item.system === "email") {
        email = item.value;
      }
    });
    return email;
  };

  /**
   * @method accountUpdate
   *
   * update account information of the beneficiary, resolve with the updated object
   *
   * @param accountData
   * @returns {Promise}
   */
  this.accountUpdate = function (accountData) {
    var that = this;

    function checkUniqLogin() {
      return new Promise(function (resolve, reject) {
        var search = {login: accountData.login.toLowerCase(), 'person.id': {'$ne': that._id}};

        physioDOM.db.collection("account").count(search, function (err, count) {
          resolve(count);
        });
      });
    }

    return new Promise(function (resolve, reject) {
      logger.trace("accountUpdate");
      checkUniqLogin()
        .then(function (count) {
          if (count) {
            logger.warning("login conflict");
            var err = {code: 409, message: "login already used"};
            if (accountData.IDS === "true") {
              err = {code: 409, message: "email already used"};
            }
            reject(err);
          } else {
            return that.getAccount();
          }
        })
        .then(function (account) {
          logger.trace("account", accountData);
          if (accountData.IDS === "true") {
            if (account.login) {
              // keep the old login if exists
              accountData.login = account.login;
            } else {
              accountData.login = that.getEmail();
            }
          }
          if (!(accountData.login || accountData.IDS === "true" ) || !accountData.password) {
            return reject({error: "account data incomplete"});
          }
          var newAccount = {
            login      : accountData.login.toLowerCase(),
            password   : accountData.password === account.password ? account.password : md5(accountData.password),
            active     : that.active,
            role       : "beneficiary",
            email      : that.getEmail(),
            firstlogin : true,
            firstpasswd: accountData.password !== account.password ? accountData.password : account.firstpasswd,
            person     : {
              id        : that._id,
              collection: "beneficiaries"
            }
          };
          if (account && account._id) {
            newAccount._id = account._id;
            newAccount.OTP = account.OTP ? account.OTP : false;
          } else {
            newAccount.OTP = false;
          }
          physioDOM.db.collection("account").save(newAccount, function (err, result) {
            if (err) {
              throw err;
            }
            if (isNaN(result)) {
              newAccount._id = result._id;
            }
            that.account = newAccount._id;
            // that.active = true;
            that.save()
              .then(function (beneficiary) {
                logger.info("benneficiary saved, OTP : ", newAccount.OTP);
                resolve(beneficiary, newAccount.OTP);
              })
              .catch(reject);
          });
        });
    });
  };

  /**
   * Update the beneficiary
   *
   * `updatedEntry` is a full object that replace the old one
   *
   * @param updatedEntry
   * @returns {Promise}
   */
  this.update = function (updatedEntry, professionalID, IDS) {
    var that = this;
    var accountData = null;
    var pushFirstName = false;
    return new Promise(function (resolve, reject) {
      logger.trace("update");
      if (that._id.toString() !== updatedEntry._id) {
        logger.warning("not same beneficiary");
        throw {code: 405, message: "not same beneficiary"};
      }
      updatedEntry._id = that._id;
      checkSchema(updatedEntry)
        .then(function (updatedEntry) {
          logger.debug("schema is valid");
          for (var key in updatedEntry) {
            if (key !== "_id" && updatedEntry.hasOwnProperty(key)) {
              switch (key) {
                case "name":
                  that.name = updatedEntry.name;
                  if (updatedEntry.name.family) {
                    that.name.family = capitalize(that.name.family);
                    pushFirstName = true;
                  }
                  if (updatedEntry.name.given) {
                    that.name.given = capitalize(that.name.given);
                    pushFirstName = true;
                  }
                  break;
                case "account":
                  accountData = updatedEntry.account;
                  break;
                case "address":
                  that.address = updatedEntry.address;
                  that.address.forEach(function (address) {
                    address.city = address.city.toUpperCase();
                  });
                  break;
                case "biomaster":
                  if (that.biomaster !== updatedEntry.biomaster) {
                    // biomaster box have changed, remove the status
                    that.biomasterStatus = null;
                  }
                  that.biomaster = updatedEntry.biomaster;
                  break;
                default:
                  that[key] = updatedEntry[key];
              }
            }
          }
          if (!updatedEntry.size) {
            delete that.size;
          }
          that.source = professionalID;
          that.datetime = moment().toISOString();

          return that.save();
        })
        .then(function () {
          return that.createEvent("Beneficiary", "update", updatedEntry._id, professionalID);
        })
        .then(function () {
          return new Promise(function (resolve, reject) {
            if (accountData && Object.keys(accountData).length) {
              if (IDS && !accountData.login) {
                accountData.login = that.getEmail();
                accountData.IDS = true;
              }
              that.accountUpdate(accountData)
                .then(resolve)
                .catch(function (err) {
                  logger.warning("accountUpdate", err);
                  reject(err);
                });
            } else {
              resolve(that);
            }
          });
        })
        .then(function () {
          if (pushFirstName) {
            return that.pushFirstName();
          }
        })
        .then(function () {
          resolve(that);
        })
        .catch(function (err) {
          logger.warning("catch", err);
          reject(err);
        });
    });
  };

  this.accountUpdatePasswd = function (newPasswd) {
    logger.trace("accountUpdatePasswd");
    var that = this;
    return new Promise(function (resolve, reject) {
      that.getAccount()
        .then(function (account) {
          account.password = md5(newPasswd);
          account.firstlogin = false;
          account.firstpasswd = null;
          physioDOM.db.collection("account").save(account, function (err, result) {
            if (err) {
              throw err;
            }
            resolve(account);
          });
        })
        .catch(reject);
    });
  };

  this.createCert = function (req, res) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("createCert");
      that.getAccount()
        .then(function (account) {
          var email = that.getEmail();
          var cookies = new Cookies(req, res);

          var certRequest = {
            certrequest: {
              Application       : physioDOM.config.IDS.appName,
              Requester         : req.headers["ids-user"],
              AuthCookie        : cookies.get("sessionids"),
              OrganizationUnit  : physioDOM.config.IDS.OrganizationUnit,
              Owner             : "03" + email,
              Identifier        : email,
              Privilege         : 255,
              Profile           : 0,
              Duration          : physioDOM.config.IDS.duration ? physioDOM.config.IDS.duration : 365,
              AuthenticationMask: 8,
              Number            : 3,
              Comment           : "Create certificate for " + email
            }
          };

          var wsdl = 'http://api.idshost.priv/pki.wsdl';
          soap.createClient(wsdl, function (err, client) {
            if (err) {
              logger.alert("error ", err);
              throw err;
            }

            client.CertRequest(certRequest, function (err, result) {
              if (err) {
                throw err;
              } else {
                logger.info("certResponse", result);
                account.OTP = result.certresponse.OTP;
                physioDOM.db.collection("account").save(account, function (err, result) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(account);
                  }
                });
              }
            });
          });
        })
        .catch(reject);
    });
  };

  this.revokeCert = function (req, res) {
    var that = this;
    logger.trace("revokeCert");

    return new Promise(function (resolve, reject) {
      that.getAccount()
        .then(function (account) {
          var cookies = new Cookies(req, res);
          var email = that.getEmail();

          var CertRevocate = {
            certRevocateRequest: {
              Application     : physioDOM.config.IDS.appName,
              Requester       : req.headers["ids-user"],
              AuthCookie      : cookies.get("sessionids"),
              OrganizationUnit: physioDOM.config.IDS.OrganizationUnit,
              Owner           : "03" + email,
              Index           : -1,
              Comment         : "Revoke all certificates for " + email
            }
          };

          var wsdl = 'http://api.idshost.priv/pki.wsdl';
          soap.createClient(wsdl, function (err, client) {
            if (err) {
              logger.alert(err);
              throw err;
            }

            client.CertRevocate(CertRevocate, function (err, result) {
              if (err) {
                if (err.root.Envelope.Body.Fault.faultcode === "E_NOTFOUND") {
                  logger.warning("certificat not found");
                  account.OTP = false;
                  physioDOM.db.collection("account").save(account, function (err, result) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(account);
                    }
                  });
                } else {
                  logger.warning(err);
                  throw err;
                }
              } else {
                logger.info("certRevokeResponse", result);
                account.OTP = false;
                physioDOM.db.collection("account").save(account, function (err, result) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(account);
                  }
                });
              }
            });
          });
        })
        .catch(function (err) {
          if (err.stack) {
            console.log(err.stack);
          }
          reject(err);
        });
    });
  };

  this.getEvents = function () {
    return new Promise(function (resolve, reject) {
      logger.trace("getEvents");
      resolve({});
    });
  };

  this.getHealthServices = function () {
    return new Promise(function (resolve, reject) {
      logger.trace("getHealthServices");
      resolve({});
    });
  };

  this.getSocialServices = function () {
    return new Promise(function (resolve, reject) {
      logger.trace("getSocialServices");
      resolve({});
    });
  };

  this.getDietaryServices = function () {
    return new Promise(function (resolve, reject) {
      logger.trace("getDietaryServices");
      resolve({});
    });
  };

  /**
   * Get the Professional name for the warning status
   *
   * @returns {Promise}
   */
  this.getWarningProfessional = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
      if (!that.warning || !that.warning.source) {
        resolve("-");
      } else if (that.warning.source === "Home") {
        resolve("Home");
      } else {
        physioDOM.Directory()
          .then(function (directory) {
            return directory.getEntryByID(that.warning.source.toString());
          })
          .then(function (professional) {
            resolve(professional.name.family + ' ' + professional.name.given);
          })
          .catch(function (err) {
            resolve("-");
          });
      }
    });
  };

  this.setWarningStatus = function (status, professionalID) {
    logger.trace("setWarningStatus", status, professionalID);
    var that = this;
    return new Promise(function (resolve, reject) {
      if (!that.warning) {
        that.warning = {status: false, source: null, date: null};
      }
      if (status && that.warning.status) {
        // a warning is already raised : do nothing
        resolve(that.warning);
      } else if (status === true && that.warning.status === false) {
        // raise the warning status
        that.warning.status = true;
        that.warning.source = professionalID;
        that.warning.date = moment().toISOString();
        that.save()
          .then(resolve(that.warning))
          .catch(function (err) {
            if (err.stack) {
              console.log(err.stack);
            }
            reject(err);
          });
      } else if (status === false && that.warning.status === true) {
        // disable the warning status
        that.warning.status = false;
        that.warning.source = professionalID;
        that.warning.date = moment().toISOString();
        that.save()
          .then(resolve(that.warning))
          .catch(function (err) {
            if (err.stack) {
              console.log(err.stack);
            }
            reject(err);
          });
      } else {
        resolve(that.warning);
      }
    });
  };

  /**
   * Get Professionals list attached to the beneficiary
   *
   * @returns {Promise}
   */
  this.getProfessionals = function (jobFilter) {
    var that = this,
      proList = [];
    if (that.professionals === undefined) {
      that.professionals = [];
    }
    return new Promise(function (resolve, reject) {
      logger.trace("getProfessionals");
      var count = that.professionals.length;
      that.professionals.sort(function (a, b) {
        return b.referent ? true : false;
      });
      if (!count) {
        resolve([]);
      }
      physioDOM.Directory()
        .then(function (directory) {
          that.professionals.forEach(function (item, i) {
            directory.getEntryByID(item.professionalID.toString())
              .then(function (professional) {
                that.professionals[i] = professional;
                that.professionals[i].referent = item.referent;

                if (jobFilter && jobFilter.indexOf(that.professionals[i].role) !== -1) {
                  // && that.professionals[i].active : to filter only active professionnal
                  proList.push(that.professionals[i]);
                }
              })
              .then(function () {
                if (--count === 0) {
                  if (jobFilter) {
                    resolve(proList);
                  } else {
                    that.professionals.sort(function (a, b) {
                      if (b.referent) {
                        return true;
                      } else if (a.referent) {
                        return false;
                      } else {
                        return b.name.family < a.name.family ? true : false;
                      }
                    });
                    resolve(that.professionals);
                  }
                }
              })
              .catch(function (err) {
                if (--count === 0) {
                  resolve(that.professionals);
                }
              });
          });
        })
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  /**
   * Get Professionals list attached to the beneficiary
   *
   * @returns {Promise}
   */
  this.getProfessionalsRoleClass = function (roleClass) {
    var that = this,
      proList = [];

    return new Promise(function (resolve, reject) {
      logger.trace("getProfessionalsRoleClass");

      physioDOM.Lists.getListItemsObj("role")
        .then(function (list) {
          var keys = Object.keys(list);
          keys.forEach(function (key) {
            var item = list[key];
            if (item.roleClass === roleClass) {
              proList.push(item.ref);
            }
          });
          return that.getProfessionals(proList)
        })
        .then(resolve);
    });
  };

  this.hasProfessional = function (professionalID) {
    var that = this;
    if (that.professionals === undefined) {
      that.professionals = [];
    }
    return new Promise(function (resolve, reject) {
      logger.trace("hasProfessional", professionalID);
      var hasProfessional = false;
      that.professionals.forEach(function (professional) {
        if (professional.professionalID === professionalID.toString()) {
          hasProfessional = true;
        }
      });
      resolve(hasProfessional);
    });
  };

  /**
   * Attach a professional to the beneficiary
   *
   * @param professionalID
   * @param referent
   * @returns {Promise}
   */
  this.addProfessional = function (professionalID, referent) {
    var that = this;
    if (!that.professionals) {
      that.professionals = [];
    }
    return new Promise(function (resolve, reject) {
      logger.trace("addProfessional ", professionalID);
      physioDOM.Directory()
        .then(function (directory) {
          return directory.getEntryByID(professionalID);
        })
        .then(function (professional) {
          // check if professional is already added
          var indx = -1;
          that.professionals.forEach(function (item, i) {
            if (item.professionalID.toString() === professional._id.toString()) {
              indx = i;
            }
          });
          if (indx !== -1) {
            that.professionals[indx] = {professionalID: professional._id, referent: referent || false};
          } else {
            that.professionals.push({professionalID: professional._id, referent: referent || false});
          }
          return that.save();
        })
        .then(function () {
          return that.getProfessionals();
        })
        .then(function (professionals) {
          resolve(professionals);
        })
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  /**
   * Attach an array of professionals to the beneficiary
   *
   * @param professionals {array} array of objects
   *        { professionalID: xxxx, referent: true|false }`
   * @param referent
   * @returns {Promise}
   */
  this.addProfessionals = function (professionals) {
    var that = this;
    if (!that.professionals) {
      that.professionals = [];
    }

    return new Promise(function (resolve, reject) {
      logger.trace("addProfessionals ");
      physioDOM.Directory()
        .then(function (directory) {
          function check(professionalObj) {
            return new Promise(function (resolve, reject) {
              directory.getEntryByID(professionalObj.professionalID)
                .then(function (professional) {
                  resolve({
                    professionalID: professional._id,
                    referent      : professionalObj.referent && professionalObj.referent === true ? true : false
                  });
                })
                .catch(function (err) {
                  reject(err);
                });
            });
          }

          return RSVP.all(professionals.map(check));
        })
        .then(function (professionals) {
          that.professionals = professionals;
          return that.save();
        })
        .then(function () {
          return that.getProfessionals();
        })
        .then(function (professionals) {
          resolve(professionals);
        })
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  /**
   * remove a professional from a beneficiary
   *
   * @param professionalID
   * @returns {Promise}
   */
  this.delProfessional = function (professionalID) {
    var that = this;
    if (!that.professionals) {
      that.professionals = [];
    }
    return new Promise(function (resolve, reject) {
      logger.trace("delProfessional ", professionalID);
      physioDOM.Directory()
        .then(function (directory) {
          return directory.getEntryByID(professionalID);
        })
        .then(function (professional) {
          // check if professional is already added
          var indx = -1;

          that.professionals.forEach(function (item, i) {
            if (item.professionalID.toString() === professional._id.toString()) {
              indx = i;
            }
          });
          if (indx !== -1) {
            if (that.professionals.length > 1) {
              that.professionals.splice(indx, 1);
            } else {
              that.professionals = [];
            }
            return that.save();
          } else {
            throw {code: 404, message: "-> professional " + professionalID + " not found"};
          }
        })
        .then(function () {
          return that.getProfessionals();
        })
        .then(function (professionals) {
          resolve(professionals);
        })
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  /**
   * Not implemented
   *
   * @returns {Promise}
   */
  this.getContacts = function () {
    return new Promise(function (resolve, reject) {
      logger.trace("getContact");
    });
  };

  /**
   * on resolve return the list of dataRecords of the current beneficiary
   *
   * dataRecords are sorted by default by date
   *
   * @param pg
   * @param offset
   * @param sort
   * @param sortDir
   * @param filter
   * @returns {Promise}
   */
  this.getDataRecords = function (pg, offset, sort, sortDir, filter) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getDataRecords");
      physioDOM.DataRecords(that._id)
        .then(function (datarecords) {
          resolve(datarecords.getList(pg, offset, sort, sortDir, filter));
        });
    });
  };

  /**
   * on resolve return a complete DataRecord for display
   *
   * @param dataRecordID
   * @returns {Promise}
   */
  this.getCompleteDataRecordByID = function (dataRecordID) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getCompleteDataRecordByID", dataRecordID);
      physioDOM.DataRecords(that._id)
        .then(function (datarecords) {
          return datarecords.getByID(new ObjectID(dataRecordID));
        })
        .then(function (datarecord) {
          resolve(datarecord.getComplete());
        })
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  this.getDataRecordByID = function (dataRecordID) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getDataRecordByID", dataRecordID);
      physioDOM.DataRecords(that._id)
        .then(function (datarecords) {
          return datarecords.getByID(new ObjectID(dataRecordID));
        })
        .then(resolve)
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  this.deleteDataRecordByID = function (dataRecordID) {
    return new Promise(function (resolve, reject) {
      logger.trace("deleteDataRecordByID", dataRecordID);
      var search = {_id: new ObjectID(dataRecordID)};
      physioDOM.db.collection("dataRecords").remove(search, function (err, nb) {
        if (err) {
          reject(err);
        }
        physioDOM.db.collection("dataRecordItems").remove({dataRecordID: new ObjectID(dataRecordID)}, function (err, nbItems) {
          if (err) {
            reject(err);
          }
          physioDOM.db.collection("events").remove({ref: new ObjectID(dataRecordID)}, function (err, nbItems) {
            if (err) {
              reject(err);
            }
            resolve(nb);
          });
        });
      });
    });
  };

  /**
   * Create a dataRecord for the current beneficiary from the given dataRecordObj
   *
   * on resolve return the full dataRecord Object
   *
   * @param dataRecordObj
   * @returns {Promise}
   */
  this.createDataRecord = function (dataRecordObj, professionalID) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("createDataRecord", dataRecordObj, professionalID);
      var dataRecord = new DataRecord();
      dataRecord.setup(that._id, dataRecordObj, professionalID)
        .then(function (_dataRecord) {
          return _dataRecord.getComplete();
        })
        .then(function (_dataRecord) {
          dataRecord = _dataRecord;
          return that.createEvent('Data record', 'create', new ObjectID(dataRecord._id), professionalID);
        })
        .then(function () {
          return that.getThreshold();
        })
        .then(function (thresholds) {
          var outOfRange = false;
          dataRecord.items.items.forEach(function (item) {
            if (thresholds[item.text]) {
              if (thresholds[item.text].min && item.value < thresholds[item.text].min) {
                outOfRange = true;
              }
              if (thresholds[item.text].max && item.value > thresholds[item.text].max) {
                outOfRange = true;
              }
            }
          });
          if (outOfRange) {
            return that.createEvent('Data record', 'overtake', new ObjectID(dataRecord._id), professionalID);
          } else {
            return;
          }
        })
        .then(function () {
          if (physioDOM.config.queue) {
            return that.pushLastDHDFFQ();
          } else {
            return false;
          }
        })
        .then(function () {
          if (physioDOM.config.queue) {
            return that.pushHistory();
          } else {
            return false;
          }
        })
        .then(function () {
          return that.getCompleteDataRecordByID(dataRecord._id);
        })
        .then(function () {
          return new Promise(function (resolve, reject) {
            var log = {
              subject   : that._id,
              datetime  : moment().toISOString(),
              source    : professionalID,
              collection: "dataRecords",
              action    : "create",
              what      : dataRecord
            };
            physioDOM.db.collection("journal").save(log, function (err) {
              resolve(dataRecord);
            });
          });
        })
        .then(resolve)
        .catch(reject);
    });
  };

  this.getThreshold = function () {
    var thresholdResult = {};
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getThreshold", that._id);
      dbPromise.findOne(physioDOM.db, "lists", {name: "parameters"}, {"items.ref": 1, "items.threshold": 1})
        .then(function (thresholds) {
          thresholds.items.forEach(function (threshold) {
            thresholdResult[threshold.ref] = threshold.threshold;
          });
          return thresholdResult;
        })
        .then(function (thresholdResult) {
          for (var prop in that.threshold) {
            if (thresholdResult.hasOwnProperty(prop)) {
              thresholdResult[prop] = that.threshold[prop];
            }
          }
          resolve(thresholdResult);
        });
    });
  };

  /**
   * update the threshold limits of the current beneficiary with
   * the given "updatedThresholds" object
   *
   * @param updatedThresholds
   * @returns {Promise}
   */
  this.setThresholds = function (updatedThresholds) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("setThreshold", that._id);

      that.getThreshold()
        .then(function (thresholdResult) {
          if (that.threshold === undefined) {
            that.threshold = {};
          }
          for (var prop in updatedThresholds) {
            if (thresholdResult.hasOwnProperty(prop)) {
              if (JSON.stringify(Object.keys(updatedThresholds[prop])) === JSON.stringify(['min', 'max'])) {
                that.threshold[prop] = updatedThresholds[prop];
              } else {
                logger.warning("bad threshold object for '" + prop + "'");
              }
            }
          }
          return that.save();
        })
        .then(function () {
          return that.getThreshold();
        })
        .then(function (thresholdResult) {
          resolve(thresholdResult);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  };

  this.getMessages = function (pg, offset, sort, sortDir, filter) {
    logger.trace("getMessages");

    var messages = new Messages(this._id);
    return messages.list(pg, offset, sort, sortDir, filter);
  };

  /**
   * Create a message to home
   *
   * @param professionalID
   * @param msg
   */
  this.createMessage = function (session, professionalID, msg) {
    logger.trace("createMessage");

    var messages = new Messages(this._id),
      that = this;

    return messages.create(session, professionalID, msg).then(function (message) {
      that.createEvent('Message', 'create', message._id, professionalID);
    });
  };

  this.createEvent = function (service, operation, elementID, senderID) {
    logger.trace("create event", service);
    var events = new Events(this._id);
    var that = this;

    return events.setup(service, operation, elementID, senderID)
      .then(function (eventObj) {
        that.lastEvent = eventObj.datetime;
        that.save();
      });
  };

  this.getGraphDataList = function (lang) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getGraphDataList", that._id);
      var graphList = {
        "General"      : [],
        "HDIM"         : [],
        "symptom"      : [],
        "questionnaire": []
      };

      var parameters;

      var reduceFunction = function (curr, result) {
        if (result.lastReport < curr.datetime) {
          result.lastReport = curr.datetime;
          result.lastValue = curr.value;
        }
        if (!result.firstReport || result.firstReport > curr.datetime) {
          result.firstReport = curr.datetime;
          result.firstValue = curr.value;
        }
      };

      var groupRequest = {
        key    : {text: 1, category: 1},
        cond   : {subject: that._id},
        reduce : reduceFunction.toString(),
        initial: {lastReport: "", firstReport: "", lastValue: 0, firstValue: 0}
      };

      function compareItems(a, b) {
        if (a.text < b.text) {
          return -1;
        }
        if (a.text > b.text) {
          return 1;
        }
        return 0;
      }

      var promises = ["parameters", "symptom", "questionnaire"].map(function (listName) {
        return physioDOM.Lists.getList(listName);
      });

      var thresholds;
      that.getThreshold()
        .then(function (_thresholds) {
          thresholds = _thresholds;
          return physioDOM.Lists.getListItemsObj("parameters");
        })
        .then(function (_parameters) {
          parameters = _parameters;
          return physioDOM.Lists.getList("units");
        })
        .then(function (units) {
          RSVP.all(promises).then(function (lists) {

            var labels = {},
              unitsData = {};

            for (var i = 0; i < lists.length; i++) {
              for (var y in lists[i].items) { // jshint ignore:line
                var ref = lists[i].items[y].ref;

                labels[ref] = lists[i].items[y].label[lang];

                for (var z in units.items) {
                  if (units.items[z].ref === lists[i].items[y].units) {
                    unitsData[ref] = units.items[z].label[lang];
                  }
                }
              }

            }

            physioDOM.db.collection("dataRecordItems").group(groupRequest.key, groupRequest.cond, groupRequest.initial, groupRequest.reduce, function (err, results) {
              if (err) {
                reject(err);
              } else {
                RSVP.all(results.map(function (result) {
                    result.name = labels[result.text] || result.text;
                    result.unit = unitsData[result.text] || '';
                    if (thresholds[result.text]) {
                      result.threshold = thresholds[result.text];
                    }
                    return result;
                  })
                )
                  .then(function (results) {
                    results.forEach(function (item) {
                      if (parameters[item.text]) {
                        item.category = parameters[item.text].category;
                      }
                    });
                    graphList.General = results.filter(function (item) {
                      return item.category === "General";
                    });
                    graphList.HDIM = results.filter(function (item) {
                      return item.category === "HDIM";
                    });
                    graphList.symptom = results.filter(function (item) {
                      return item.category === "symptom";
                    });
                    graphList.questionnaire = results.filter(function (item) {
                      return item.category === "questionnaire";
                    });

                    graphList.General.sort(compareItems);
                    graphList.HDIM.sort(compareItems);
                    graphList.symptom.sort(compareItems);
                    graphList.questionnaire.sort(compareItems);

                    resolve(graphList);
                  })
                  .catch(reject);
              }
            });
          });
        })
        .catch(reject);
    });
  };


  this.getHistoryDataList = function (lang) {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getHistoricDataList", that._id);
      var parameters;

      var graphList = {
        "General"      : [],
        "HDIM"         : [],
        "symptom"      : [],
        "questionnaire": []
      };

      var reduceFunction = function (curr, result) {
        if (!result.history.length) {
          result.history.push({datetime: curr.datetime, value: curr.value});
        } else {
          var done = false;
          for (var i = 0, l = result.history.length; i < l; i++) {
            if (result.history[i].datetime < curr.datetime) {
              result.history.splice(i, 0, {datetime: curr.datetime, value: curr.value});
              done = true;
              break;
            }
          }
          if (done === false && result.history.length < 5) {
            result.history.push({datetime: curr.datetime, value: curr.value});
          }
          if (result.history.length > 5) {
            result.history = result.history.slice(0, 5);
          }
        }
      };

      var groupRequest = {
        key    : {text: 1, category: 1, rank: 1, precision: 1, TVLabel: 1},
        cond   : {subject: that._id},
        reduce : reduceFunction.toString(),
        initial: {history: []}
      };

      function compareItems(a, b) {
        if (a.text < b.text) {
          return -1;
        }
        if (a.text > b.text) {
          return 1;
        }
        return 0;
      }

      var promises = ["parameters", "symptom", "questionnaire"].map(function (listName) {
        return physioDOM.Lists.getList(listName);
      });

      var thresholds;
      that.getThreshold()
        .then(function (_thresholds) {
          thresholds = _thresholds;
          return physioDOM.Lists.getListItemsObj("parameters");
        })
        .then(function (_parameters) {
          parameters = _parameters;
          return physioDOM.Lists.getList("units");
        })
        .then(function (units) {
          RSVP.all(promises).then(function (lists) {
            var labels = {},
              unitsData = {},
              ranks = {},
              TVLabels = {},
              precisions = {};

            for (var i = 0; i < lists.length; i++) {
              for (var y in lists[i].items) { // jshint ignore:line
                var ref = lists[i].items[y].ref;

                labels[ref] = lists[i].items[y].label[lang || physioDOM.lang] || lists[i].items[y].label.en;
                ranks[ref] = lists[i].items[y].rank || '';
                TVLabels[ref] = lists[i].items[y].TVLabel || '';
                precisions[ref] = lists[i].items[y].precision ? 1 : 0;
                for (var z in units.items) {
                  if (units.items[z].ref === lists[i].items[y].units) {
                    unitsData[ref] = units.items[z].label[lang || physioDOM.lang] || units.items[z].label.en;
                  }
                }
              }
            }

            physioDOM.db.collection("dataRecordItems").group(groupRequest.key, groupRequest.cond, groupRequest.initial, groupRequest.reduce, function (err, results) {
              if (err) {
                reject(err);
              } else {
                RSVP.all(results.map(function (result) {
                    result.name = labels[result.text] || result.text;
                    result.unit = unitsData[result.text] || '';
                    result.rank = ranks[result.text];
                    result.TVLabel = TVLabels[result.text];
                    result.precision = precisions[result.text];

                    if (thresholds[result.text]) {
                      result.threshold = thresholds[result.text];
                    }
                    return result;
                  })
                )
                  .then(function (results) {
                    results.forEach(function (item) {
                      if (parameters[item.text]) {
                        item.category = parameters[item.text].category;
                      }
                    });

                    graphList.General = results.filter(function (item) {
                      return item.category === "General";
                    });
                    graphList.HDIM = results.filter(function (item) {
                      return item.category === "HDIM";
                    });
                    graphList.symptom = results.filter(function (item) {
                      return item.category === "symptom";
                    });
                    graphList.questionnaire = results.filter(function (item) {
                      return item.category === "questionnaire";
                    });

                    graphList.General.sort(compareItems);
                    graphList.HDIM.sort(compareItems);
                    graphList.symptom.sort(compareItems);
                    graphList.questionnaire.sort(compareItems);

                    resolve(graphList);
                  })
                  .catch(function (err) {
                    if (err.stack) {
                      console.log(err.stack);
                    } else {
                      console.log(err);
                    }
                    reject(err);
                  });
              }
            });
          });
        })
        .catch(reject);
    });
  };

  this.getGraphData = function (category, paramName, startDate, stopDate, session) {
    var graphData = {text: paramName, data: []};
    var that = this;

    if (!stopDate) {
      graphData.stopDate = moment().utc();
      graphData.stopDate.hours(23);
      graphData.stopDate.minutes(59);
    } else {
      graphData.stopDate = moment(stopDate);
      graphData.stopDate.hours(23);
      graphData.stopDate.minutes(59);
      if (!graphData.stopDate.isValid()) {
        throw {code: 405, message: "stop date is invalid"};
      }
    }
    if (!startDate) {
      graphData.startDate = moment(graphData.stopDate.toISOString());
      graphData.startDate.subtract(30, "days");
    } else {
      graphData.startDate = moment(startDate);
      graphData.startDate.hours(0);
      graphData.startDate.minutes(0);
      if (!graphData.startDate.isValid()) {
        throw {code: 405, message: "start date is invalid"};
      }
    }

    if (graphData.startDate.valueOf() >= graphData.stopDate.valueOf()) {
      throw {code: 405, message: "start date must be before stop date"};
    }

    // to get the label we need to know from which list comes the parameter
    if (["General", "HDIM", "measures"].indexOf(category) !== -1) {
      category = "parameters";
    }

    function paramPromise(listName, param) {
      return new Promise(function (resolve, reject) {
        physioDOM.Lists.getList(listName)
          .then(function (list) {
            return list.getItem(paramName);
          })
          .then(function (param) {
            physioDOM.Lists.getList("units")
              .then(function (units) {
                return units.getItem(param.units);
              })
              .then(function (unit) {
                if (unit.label[session.lang || "en"] === undefined) {
                  param.unitLabel = unit.ref;
                } else {
                  param.unitLabel = unit.label[session.lang || "en"];
                }
                resolve(param);
              })
              .catch(function () {
                param.unitLabel = "";
                resolve(param);
              });
          })
          .catch(reject);
      });
    }

    return new Promise(function (resolve, reject) {
      logger.trace("getGraphData", paramName, graphData.startDate, graphData.stopDate);

      paramPromise(category, paramName)
        .then(function (param) {
          graphData.label = param.label[session.lang || "en"] || paramName;
          graphData.unit = param.unitLabel;
          graphData.unitRef = param.units;
          var search = {
            subject : that._id,
            text    : paramName,
            datetime: {
              '$gte': graphData.startDate.toISOString(),
              '$lte': graphData.stopDate.toISOString()
            }
          };
          physioDOM.db.collection("dataRecordItems").find(search).sort({measureDate: 1}).toArray(function (err, results) {
            results.forEach(function (result) {
              graphData.data.push([moment.unix(result.measureDate).valueOf(), result.value]);
              // graphData.data.push([moment(result.datetime).valueOf(), result.value]);
            });
            resolve(graphData);
          });
        })
        .catch(reject);
    });
  };


  /**
   * getDataProg
   *
   * @returns {Promise}
   */
  this.getDataProg = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getDataProg", that._id);
      resolve({});
    });
  };

  /**
   * get the data prescription for a given category
   *
   * category is one of "General","HDIM","symptom","questionnaire"
   *
   * the Promise, if succeed, return an array of all data prescription.
   *
   * @param category
   * @returns {*}
   */
  this.getDataProgCategory = function (category) {
    var that = this;
    logger.trace("getDataProgCategory", that._id, category);

    var dataProg = new DataProg(that._id);
    return dataProg.getCategory(category);
  };

  /**
   * add a data prescription`defined by the given `prescription` object
   *
   * @param prescription
   * @returns {Promise}
   */
  this.setDataProg = function (prescription, source) {
    var that = this;
    logger.trace("setDataProg", that._id, prescription.ref);

    var dataProgItem = new DataProgItem(that._id);
    return dataProgItem.setup(prescription, source);
  };

  this.delDataProg = function (dataProgItemID) {
    var that = this;
    logger.trace("delDataProg", that._id, dataProgItemID);

    var dataProg = new DataProg(that._id);
    return dataProg.remove(dataProgItemID);
  };

  this.getServices = function (category) {
    logger.trace("getServices ", category);
    var services = new Services(this);
    return services.getServices(category);
  };

  this.questionnairePlan = function () {
    logger.trace("questionnairePlan", this._id);
    return new QuestionnairePlan(this._id);
  };

  /**
   * Dietary Plan
   */

  this.createDietaryPlan = function (dietaryPlanObj, professionalID) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("createDietaryPlan");
      var dietaryPlan = new DietaryPlan(new ObjectID(that._id));
      dietaryPlan.setup(that._id, dietaryPlanObj, professionalID)
        .then(function (item) {
          that.createEvent("Dietary plan", item.count ? "update" : "create", that._id, professionalID);
        })
        .then(resolve)
        .catch(reject);
    });
  };

  this.getDietaryPlan = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getDietaryPlan");
      var dietaryPlan = new DietaryPlan(new ObjectID(that._id));
      dietaryPlan.getLastOne()
        .then(resolve)
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  this.getDietaryPlanList = function (pg, offset, sort, sortDir, filter) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getDietaryPlanList");
      var dietaryPlan = new DietaryPlan(new ObjectID(that._id));
      resolve(dietaryPlan.getItems(pg, offset, sort, sortDir, filter));
    });
  };

  /**
   * Physical Plan
   */

  this.createPhysicalPlan = function (physicalPlanObj, professionalID) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("createPhysicalPlan");
      var physicalPlan = new PhysicalPlan(new ObjectID(that._id));
      physicalPlan.setup(that._id, physicalPlanObj, professionalID)
        .then(function (item) {
          that.createEvent("Physical plan", item.count ? "update" : "create", that._id, professionalID);
        })
        .then(resolve)
        .catch(reject);
    });
  };

  this.getPhysicalPlan = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
      logger.trace("getPhysicalPlan");
      var physicalPlan = new PhysicalPlan(new ObjectID(that._id));
      physicalPlan.getLastOne()
        .then(resolve)
        .catch(function (err) {
          logger.error("error ", err);
          reject(err);
        });
    });
  };

  this.getPhysicalPlanList = function (pg, offset, sort, sortDir, filter) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getPhysicalPlanList");
      var physicalPlan = new PhysicalPlan(new ObjectID(that._id));
      resolve(physicalPlan.getItems(pg, offset, sort, sortDir, filter));
    });
  };

  this.getEventList = function (pg, offset, sort, sortDir, filter) {
    var that = this;
    return new Promise(function (resolve, reject) {
      logger.trace("getEventList");
      var events = new Events(new ObjectID(that._id));
      resolve(events.getItems(pg, offset, sort, sortDir, filter));
    });
  };

  function pushMeasure(queue, hhr, units, parameters, measures, force) {
    force = force || false;
    logger.trace('pushMeasure force:', force, hhr);
    return new Promise(function (resolve, reject) {
      // logger.trace("pushMeasure", force, measures);
      var leaf = "hhr[" + hhr + "].measures[" + measures.datetime + "]";
      physioDOM.db.collection("agendaMeasure").findOne({
        subject : hhr,
        datetime: measures.datetime
      }, function (err, doc) {
        var msg = [];
        msg.push({
          name : leaf + ".datetime",
          value: measures.datetime,
          type : "integer"
        });
        if( !force ) {
          msg.push({
            name : leaf + ".new",
            value: 1,
            type : "integer"
          });
        }
        var hasMeasure = false;
        measures.measure.forEach(function (measure) {
          // logger.debug("measure : "+measure +" rank : "+parameters[measure].rank );
          if (parameters[measure].rank) {
            hasMeasure = true;
            var name = leaf + ".params[" + parameters[measure].ref + "]";
            msg.push({
              name : name + ".type",
              value: parseInt(parameters[measure].rank, 10),
              type : "integer"
            });
            msg.push({
              name : name + ".label",
              value: parameters[measure].label[physioDOM.lang],
              type : "string"
            });
            msg.push({
              name : name + ".min",
              value: parameters[measure].range.min,
              type : "double"
            });
            msg.push({
              name : name + ".max",
              value: parameters[measure].range.max,
              type : "double"
            });
            msg.push({
              name : name + ".precision",
              value: parameters[measure].precision ? 1 : 0,
              type : "integer"
            });
            if (parameters[measure].unity && parameters[measure].unity !== 'NONE') {
              msg.push({
                name : name + ".unit",
                value: units[parameters[measure].unity].label[physioDOM.lang] || units[parameters[measure].unity].label.en,
                type : "string"
              });
            }
          }
        });

        function postMsg(msg) {
          return new Promise(function (resolve, reject) {
            queue.postMsg(msg)
              .then(function () {
                var data = {
                  datetime: measures.datetime,
                  subject : hhr,
                  items   : msg
                };
                physioDOM.db.collection("agendaMeasure").save(data, function (err, doc) {
                  resolve(msg);
                });
              })
              .catch(function (err) {
                console.log('postMsg err', err)
              });
          });
        }

        function delMsg() {
          return new Promise(function (resolve, reject) {
            queue.delMsg([{branch: leaf}])
              .then(function () {
                var data = {
                  datetime: measures.datetime,
                  subject : hhr
                };
                physioDOM.db.collection("agendaMeasure").remove(data, function (err, nb) {
                  resolve();
                });
              });
          });
        }

        if (hasMeasure) {
          if (doc) {
            if (JSON.stringify(doc.items) === JSON.stringify(msg) && !force) {
              resolve([]);
            } else {
              delMsg()
                .then(function () {
                  return postMsg(msg);
                })
                .then(resolve);
            }
          } else {
            postMsg(msg)
              .then(resolve);
          }
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * remove from agendaMeasure all measures that are not in measures
   *
   * @param queue    the queue object
   * @param hhr      the current beneficiary
   * @param measures the current measures array
   * @returns {*|RSVP.Promise}
   */
  function removeMeasures(queue, hhr, measures) {
    return new Promise(function (resolve, reject) {
      logger.trace("removeMeasures");
      var datetimes = [];
      measures.forEach(function (measure) {
        datetimes.push(measure.datetime);
      });
      var search = {
        subject : hhr,
        datetime: {'$nin': datetimes, '$gt': moment().hour(12).minute(0).second(0).unix()}
      };
      physioDOM.db.collection("agendaMeasure").find(search).toArray(function (err, items) {
        if (!items.length) {
          resolve();
        } else {
          logger.info("to remove", items);
          var promises = items.map(function (item) {
            return new Promise(function (done, reject) {
              var leaf = "hhr[" + hhr + "].measures[" + item.datetime + "]";
              queue.delMsg([{branch: leaf}])
                .then(function () {
                  physioDOM.db.collection("agendaMeasure").remove(item, function (err, nb) {
                    done();
                  });
                });
            });
          });
          RSVP.all(promises)
            .then(resolve);
        }
      });
    });
  }

  /**
   * get the measure Plan and push it to the box
   *
   * @param date
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|l|Dn}
   */
  this.getMeasurePlan = function (force) {
    var queue = new Queue(this._id);
    force = force ? force : false;
    var today = moment().hour(12).minute(0).second(0);
    var endDate = moment().add(physioDOM.config.duration, 'd').hour(12).minute(0).second(0);
    logger.trace("getMeasurePlan", this._id);
    logger.debug("MeasurePlan from " + today.toISOString() + " to " + endDate.toISOString());
    var dataProg = new DataProg(this._id);
    var msgs = [];
    var that = this;

    moment.locale(physioDOM.lang === "en" ? "en-gb" : physioDOM.lang);

    return new Promise(function (resolve, reject) {

      var promises = ["General", "HDIM"].map(function (category) {
        return dataProg.getCategory(category);
      });

      RSVP.all(promises)
        .then(function (results) {
          var progs = [];
          results.forEach(function (list) {
            progs = progs.concat(list);
          });
          progs.forEach(function (prog) {
            var startDate, nextDate, firstDay, dat, closeDate;
            switch (prog.frequency) {
              case "daily":
                startDate = moment().subtract(prog.repeat || 1, 'd');
                nextDate = moment(prog.startDate).hour(12).minute(0).second(0);
                closeDate = prog.endDate ? moment(prog.endDate).hour(12).minute(0).second(0) : endDate;
                closeDate = closeDate.unix() < endDate.unix() ? closeDate : endDate;
                while (nextDate.unix() < startDate.unix()) {
                  nextDate.add(prog.repeat || 1, 'd');
                }
                if (nextDate.unix() <= closeDate.unix()) {
                  do {
                    if (nextDate.unix() <= closeDate.unix() && nextDate.unix() > today.unix()) {
                      // logger.debug("daily prog", {ref: prog.ref, date: nextDate.unix()});
                      msgs.push({ref: prog.ref, date: nextDate.unix()});
                    }
                    nextDate.add(prog.repeat || 1, 'd');
                  } while (nextDate.unix() <= closeDate.unix());
                }
                break;
              case "weekly":
                startDate = moment().subtract(prog.repeat || 1, 'w');
                nextDate = moment(prog.startDate).day(prog.when.days[0]).hour(12).minute(0).second(0);
                closeDate = prog.endDate ? moment(prog.endDate).hour(12).minute(0).second(0) : endDate;
                closeDate = closeDate.unix() < endDate.unix() ? closeDate : endDate;
                while (nextDate.unix() < startDate.unix()) {
                  nextDate.add(prog.repeat || 1, 'w');
                }
                if (nextDate.unix() <= closeDate.unix()) {
                  do {
                    firstDay = moment.unix(nextDate.unix());
                    prog.when.days.forEach(function (day) {
                      firstDay.day(day);
                      if (firstDay.unix() <= closeDate.unix() && firstDay.unix() > today.unix()) {
                        // logger.debug("weekly prog", {ref: prog.ref, date: nextDate.unix()});
                        msgs.push({ref: prog.ref, date: firstDay.unix()});
                      }
                    }); // jshint ignore:line
                    nextDate.add(prog.repeat || 1, 'w');
                  } while (nextDate.unix() <= closeDate.unix());
                }
                break;
              case "monthly":
                startDate = moment().date(1).hour(12).minute(0).second(0);
                nextDate = moment(prog.startDate).date(1).hour(12).minute(0).second(0);
                closeDate = prog.endDate ? moment(prog.endDate).hour(12).minute(0).second(0) : endDate;
                closeDate = closeDate.unix() < endDate.unix() ? closeDate : endDate;
                while (nextDate.unix() < startDate.unix()) {
                  nextDate.add(prog.repeat || 1, 'M');
                }
                // logger.debug( "locale", moment.locale());
                // logger.debug( "startDate", startDate.toISOString());
                // logger.debug( "closeDate", closeDate.toISOString());
                // logger.debug( "nextDate",  nextDate.toISOString());
                if (nextDate.unix() <= closeDate.unix()) {
                  do {
                    // logger.debug("nextDate", nextDate.toISOString());
                    prog.when.days.forEach(function (day) {
                      // logger.debug("-> day", day);
                      if (day > 0) {
                        dat = moment.unix(nextDate.unix());
                        dat = dat.startOf('month').startOf('week');
                        if (dat.month() < nextDate.month()) {
                          dat.add(1, 'w');
                        }
                        dat.day(day % 10);
                        dat.add(Math.floor(day / 10) - 1, 'w');
                      } else {
                        dat = moment.unix(nextDate.unix());
                        dat = dat.endOf('month').startOf('week');
                        dat.day(-day % 10);
                        dat.subtract(Math.floor(-day / 10) - 1, 'w');
                      }
                      // logger.debug("dates", dat.toISOString(), closeDate.toISOString(), today.toISOString());
                      if (dat.unix() <= closeDate.unix() && dat.unix() > today.unix()) {
                        // logger.debug("monthly prog", {ref: prog.ref, date: nextDate.unix()});
                        dat = dat.hour(12).minute(0).second(0);
                        msgs.push({ref: prog.ref, date: dat.unix()});
                      }
                    });
                    nextDate.add(prog.repeat || 1, 'M');
                  } while (nextDate.unix() <= closeDate.unix());
                }
                break;
            }
          });

          var agenda = {};
          msgs.forEach(function (msg) {
            if (agenda[msg.date]) {
              agenda[msg.date].measure.push(msg.ref);
            } else {
              agenda[msg.date] = {
                datetime: msg.date,
                measure : [msg.ref],
                date    : moment.unix(msg.date).toISOString()
              };
            }
          });
          var measures = [];
          for (var measure in agenda) { // jshint ignore:line
            measures.push(agenda[measure]);
          }

          removeMeasures(queue, that._id, measures)
            .then(function () {
              var units;
              physioDOM.Lists.getListItemsObj("units")
                .then(function (results) {
                  units = results;
                  return physioDOM.Lists.getListItemsObj("parameters");
                })
                .then(function (parameters) {
                  physioDOM.Lists.getListItemsObj("parameters")
                    .then(function (parameters) {
                      var promises = measures.map(function (measure) {
                        return new Promise(function (resolve, reject) {
                          measure.subject = that._id;

                          pushMeasure(queue, that._id, units, parameters, measure, force)
                            .then(function (msg) {
                              resolve(msg);
                            })
                            .catch(function (err) {
                              console.log('pushMeasure return', err);
                              reject(err);
                            });
                        });
                      });

                      RSVP.all(promises)
                        .then(function (result) {
                          var res = [];
                          result.forEach(function (item) {
                            if (item.length > 0) {
                              res.push(item);
                            }
                          });
                          resolve(res);
                        })
                        .catch(function (err) {
                          console.log('getMeasurePlan error', err);
                          reject(err);
                        });
                    });
                });
            });
        })
        .catch(function (err) {
          console.log("erreur detectée");
          console.log(err.stack);
          reject(err);
        });
    });
  };

  /**
   * Push a symptom Self to the queue
   *
   * @param symptomSelf
   */
  this.pushSymptomsSelfToQueue = function (symptomSelf) {
    logger.trace("pushSymptomsSelfToQueue");

    var queue = new Queue(this._id);
    var leaf = "hhr[" + this._id + "].symptomsSelf.scales[" + symptomSelf.ref + "]";

    return new Promise(function (resolve, reject) {
      var msg = [];
      if (!symptomSelf.active) {
        resolve(false);
      }
      msg.push({
        name : leaf + ".label",
        value: symptomSelf.label[physioDOM.lang] || symptomSelf.ref,
        type : "string"
      });
      if (symptomSelf.history) {
        msg.push({
          name : leaf + ".lastValue",
          value: symptomSelf.history[0].value,
          type : "double"
        });
      }
      queue.postMsg(msg)
        .then(function () {
          resolve(msg);
        });
    });

  };

  /**
   * Push the whole symptoms self to queue
   */
  this.symptomsSelfToQueue = function () {
    var queue = new Queue(this._id);
    var name = "hhr[" + this._id + "].symptomsSelf";
    var that = this;
    logger.trace("symptomsSelfToQueue");

    var symptoms = new Symptoms(this);

    return new Promise(function (resolve, reject) {
      queue.delMsg([{branch: name}])
        .then(function () {
          return symptoms.getHistoryList();
        })
        .then(function (list) {
          var promises = Object.keys(list).map(function (key) {
            var symptomSelf = list[key];
            return that.pushSymptomsSelfToQueue(symptomSelf);
          });
          RSVP.all(promises)
            .then(function (results) {
              resolve(results);
            });
        });
    });
  };

  function pushSymptom(queue, hhr, symptoms, measures, force) {
    // logger.trace("pushSymptom");
    force = force || false;

    return new Promise(function (resolve, reject) {
      var leaf = "hhr[" + hhr + "].symptoms[" + measures.datetime + "]";

      function postMsg(msg) {
        return new Promise(function (resolve, reject) {
          queue.postMsg(msg)
            .then(function () {
              var data = {
                datetime: measures.datetime,
                subject : hhr,
                items   : msg
              };
              physioDOM.db.collection("agendaSymptoms").save(data, function (err, doc) {
                resolve(msg);
              });
            });
        });
      }

      function delMsg() {
        return new Promise(function (resolve, reject) {
          queue.delMsg([{branch: leaf}])
            .then(function () {
              var data = {
                datetime: measures.datetime,
                subject : hhr
              };
              physioDOM.db.collection("agendaSymptoms").remove(data, function (err, nb) {
                resolve();
              });
            });
        });
      }

      physioDOM.db.collection("agendaSymptoms").findOne({
        subject : hhr,
        datetime: measures.datetime
      }, function (err, doc) {
        var msg = [];

        msg.push({
          name : leaf + ".datetime",
          value: measures.datetime,
          type : "integer"
        });
        if( !force ) {
          msg.push({
            name : leaf + ".new",
            value: 1,
            type : "integer"
          });
        }
        var hasMeasure = false;
        measures.measure.forEach(function (measure) {
          if (symptoms[measure].rank) {
            hasMeasure = true;
            var name = leaf + ".scales[" + symptoms[measure].ref + "]";
            msg.push({
              name : name + ".label",
              value: symptoms[measure].label[physioDOM.lang],
              type : "string"
            });
            if (symptoms[measure].history && symptoms[measure].history.length) {
              msg.push({
                name : name + ".lastValue",
                value: symptoms[measure].history[0].value,
                type : "double"
              });
            }
          }
        });

        if (hasMeasure) {
          if (doc) {
            if (JSON.stringify(doc.items) === JSON.stringify(msg) && !force) {
              resolve([]);
            } else {
              delMsg()
                .then(function () {
                  return postMsg(msg);
                })
                .then(resolve);
            }
          } else {
            postMsg(msg)
              .then(resolve);
          }
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * remove from agendaSymptoms all symptoms assessments that are not in symptoms
   *
   * @param queue    the queue object
   * @param hhr      the current beneficiary
   * @param measures the current measures array
   * @returns {*|RSVP.Promise}
   */
  function removeSymptomsPlan(queue, hhr, symptoms) {
    return new Promise(function (resolve, reject) {
      logger.trace("removeSymptomsPlan");
      var datetimes = [];
      symptoms.forEach(function (symptom) {
        datetimes.push(symptom.datetime);
      });
      var search = {
        subject : hhr,
        datetime: {'$nin': datetimes, '$gt': moment().hour(12).minute(0).second(0).unix()}
      };
      physioDOM.db.collection("agendaSymptoms").find(search).toArray(function (err, items) {
        if (!items.length) {
          resolve();
        } else {
          logger.info("to remove ", items.length);
          var promises = items.map(function (item) {
            return new Promise(function (done, reject) {
              var leaf = "hhr[" + hhr + "].symptoms[" + item.datetime + "]";
              queue.delMsg([{branch: leaf}])
                .then(function () {
                  physioDOM.db.collection("agendaSymptoms").remove(item, function (err, nb) {
                    done();
                  });
                });
            });
          });
          RSVP.all(promises)
            .then(resolve);
        }
      });
    });
  }

  this.updateSymptomsLastValue = function (dataRecordID) {
    // dataRecordID
    logger.trace("updateSymptomsLastValue", dataRecordID);
    var that = this;
    var queue = new Queue(this._id);

    this.getDataRecordByID(dataRecordID)
      .then(function (record) {
        // console.log("record", record);
        return record.getComplete();
      })
      .then(function (record) {
        // record.items.items array of all dataRecordID
        var items = record.items.items;
        // console.log("items", items);
        items.forEach(function (item) {
          var reg = new RegExp(".scales\\\[" + item.text + "\\\]", "i");
          var search = {
            subject     : that._id,
            datetime    : {'$gt': Math.ceil((new Date()).valueOf() / 1000)},
            'items.name': reg
          };
          // console.log( "search", search );
          physioDOM.db.collection("agendaSymptoms").find(search).toArray(function (err, events) {
            // console.log("founds : ",events.length);
            // console.log(search, item.text );
            var tmp;
            for (var i = 0, l = events.length; i < l; i++) {
              tmp = null;
              for (var j = 0, nbItems = events[i].items.length; j < nbItems; j++) {
                reg = new RegExp(".scales\\\[" + item.text + "\\\].lastValue$", "i");
                if (events[i].items[j].name.match(reg)) {
                  tmp = events[i].items[j];
                  break;
                }
              }
              if (tmp) {
                tmp.value = item.value;
              } else {
                tmp = {
                  name : 'hhr[' + that._id + '].symptoms[' + events[i].datetime + '].scales[' + item.text + '].lastValue',
                  value: item.value,
                  type : "double"
                };
                events[i].items.push(tmp);
              }
              // update the event in the database
              physioDOM.db.collection("agendaSymptoms").save(events[i], function (err, result) {
                if (err) {
                  logger.error("error saving to database", err);
                }

                // push to queue
                queue.delMsg([{branch: tmp.name}])
                  .then(function () {
                    // console.log("post new lastValue", tmp.name, tmp.value );
                    return queue.postMsg([tmp]);
                  });
              });

            }
          });
        });
      })
      .catch(function (err) {
        logger.warning("error detected");
        console.log(err);
        if (err.stack) {
          console.log(err.stack);
        }
      });
  };

  /**
   * Get the symptoms plan and push it to the box
   *
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|l|Dn}
   */
  this.getSymptomsPlan = function (force) {
    var queue = new Queue(this._id);

    var today = moment().hour(12).minute(0).second(0);
    var endDate = moment().add(physioDOM.config.duration, 'd').hour(12).minute(0).second(0);
    logger.debug("SymptomPlan from " + today.toISOString() + " to " + endDate.toISOString());
    var dataProg = new DataProg(this._id);
    var msgs = [];
    var that = this;

    return new Promise(function (resolve, reject) {
      dataProg.getCategory("symptom")
        .then(function (progs) {
          progs.forEach(function (prog) {
            var startDate, nextDate, firstDay, dat, closeDate;

            switch (prog.frequency) {
              case "daily":
                startDate = moment().subtract(prog.repeat || 1, 'd');
                nextDate = moment(prog.startDate).hour(12).minute(0).second(0);
                closeDate = prog.endDate ? moment(prog.endDate).hour(12).minute(0).second(0) : endDate;
                closeDate = closeDate.unix() < endDate.unix() ? closeDate : endDate;
                while (nextDate.unix() < startDate.unix()) {
                  nextDate.add(prog.repeat || 1, 'd');
                }
                if (nextDate.unix() <= closeDate.unix()) {
                  do {
                    if (nextDate.unix() <= closeDate.unix() && nextDate.unix() > today.unix()) {
                      msgs.push({ref: prog.ref, date: nextDate.unix()});
                    }
                    nextDate.add(prog.repeat || 1, 'd');
                  } while (nextDate.unix() <= closeDate.unix());
                }
                break;
              case "weekly":
                startDate = moment().subtract(prog.repeat || 1, 'w');
                nextDate = moment(prog.startDate).day(prog.when.days[0]).hour(12).minute(0).second(0);
                closeDate = prog.endDate ? moment(prog.endDate).hour(12).minute(0).second(0) : endDate;
                closeDate = closeDate.unix() < endDate.unix() ? closeDate : endDate;
                while (nextDate.unix() < startDate.unix()) {
                  nextDate.add(prog.repeat || 1, 'w');
                }
                if (nextDate.unix() <= closeDate.unix()) {
                  do {
                    firstDay = moment.unix(nextDate.unix());
                    prog.when.days.forEach(function (day) {
                      firstDay.day(day);

                      if (firstDay.unix() <= closeDate.unix() && firstDay.unix() > today.unix()) {
                        msgs.push({ref: prog.ref, date: firstDay.unix()});
                      }
                    }); // jshint ignore:line
                    nextDate.add(prog.repeat || 1, 'w');
                  } while (nextDate.unix() <= closeDate.unix());

                }
                break;
              case "monthly":
                startDate = moment().date(1).hour(12).minute(0).second(0);
                nextDate = moment(prog.startDate).date(1).hour(12).minute(0).second(0);
                closeDate = prog.endDate ? moment(prog.endDate).hour(12).minute(0).second(0) : endDate;
                closeDate = closeDate.unix() < endDate.unix() ? closeDate : endDate;
                while (nextDate.unix() < startDate.unix()) {
                  nextDate.add(prog.repeat || 1, 'M');
                }

                if (nextDate.unix() <= closeDate.unix()) {
                  prog.when.days.forEach(function (day) {
                    if (day > 0) {
                      dat = moment.unix(nextDate.unix());
                      dat.day(day % 10);
                      dat.add(Math.floor(day / 10) - 1, 'w');
                    } else {
                      dat = moment.unix(nextDate.unix()).add(1, 'M').subtract(1, 'd');
                      dat.day(-day % 10);
                      dat.subtract(Math.floor(-day / 10) - 1, 'w');
                    }
                    if (dat.unix() <= closeDate.unix() && dat.unix() > today.unix()) {
                      dat = dat.hour(12).minute(0).second(0);
                      msgs.push({ref: prog.ref, date: dat.unix()});
                    }
                  });
                }
                break;
            }
          });
          var results = {};
          msgs.forEach(function (msg) {
            if (results[msg.date]) {
              results[msg.date].measure.push(msg.ref);
            } else {
              results[msg.date] = {
                datetime: msg.date,
                measure : [msg.ref],
                date    : moment.unix(msg.date).toISOString()
              };
            }
          });
          var measures = [];
          for (var measure in results) {
            measures.push(results[measure]);
          }
          removeSymptomsPlan(queue, that._id, measures)
            .then(function () {
              var symptoms = new Symptoms(that);
              var symptomsHistory;

              symptoms.getHistoryList()
                .then(function (symptoms) {
                  var promises = measures.map(function (measure) {
                    return new Promise(function (resolve, reject) {
                      measure.subject = that._id;
                      pushSymptom(queue, that._id, symptoms, measure, force)
                        .then(function (msg) {
                          resolve(msg);
                        });
                    });
                  });
                  RSVP.all(promises)
                    .then(function (result) {
                      var res = [];
                      result.forEach(function (item) {
                        if (item.length > 0) {
                          res.push(item);
                        }
                      });
                      resolve(res);
                    });
                });
            });
        });
    });
  };

  function pushQuestionnaire(queue, name, quest, newFlag) {
    return new Promise(function (resolve, reject) {
      /*
       questionnaires[id].label
       questionnaires[id].new
       questionnaires[id].scores[id].datetime
       questionnaires[id].scores[id].value
       */
      logger.trace("pushQuestionnaire", quest.text);

      var msg = [];
      if (quest.TVLabel) {
        var leaf = name + ".questionnaires[" + quest.text + "]";

        queue.delMsg([{branch: leaf}])
          .then(function () {
            logger.trace("questionnare " + quest.text + " cleared");

            msg.push({
              name : leaf + ".label",
              value: quest.TVLabel,
              type : "string"
            });
            msg.push({
              name : leaf + ".new",
              value: newFlag ? 1 : 0,
              type : "integer"
            });
            for (var i = 0, l = quest.history.length; i < l; i++) {
              msg.push({
                name : leaf + ".scores[" + i + "].datetime",
                value: moment(quest.history[i].datetime).unix(),
                type : "integer"
              });
              msg.push({
                name : leaf + ".scores[" + i + "].value",
                value: quest.history[i].value,
                type : "double"
              });
            }
            queue.postMsg(msg)
              .then(function () {
                resolve(msg);
              });
          });
      } else {
        resolve(msg);
      }
    });
  }

  function pushParam(queue, name, param) {
    return new Promise(function (resolve, reject) {
      var msg = [];
      if (param.rank) {
        var leaf = name + ".measuresHistory.params[" + param.text + "]";

        msg.push({
          name : leaf + ".label",
          value: param.name,
          type : "string"
        });
        msg.push({
          name : leaf + ".type",
          value: param.rank,
          type : "integer"
        });
        msg.push({
          name : leaf + ".precision",
          value: param.precision,
          type : "integer"
        });
        if (param.unit.length) {
          msg.push({
            name : leaf + ".unit",
            value: param.unit,
            type : "string"
          });
        }
        for (var i = 0, l = param.history.length; i < l; i++) {
          msg.push({
            name : leaf + ".values[" + i + "].datetime",
            value: moment(param.history[i].datetime).unix(),
            type : "integer"
          });
          msg.push({
            name : leaf + ".values[" + i + "].value",
            value: param.history[i].value,
            type : "double"
          });
        }
        queue.postMsg(msg)
          .then(function () {
            resolve(msg);
          });
      } else {
        resolve(msg);
      }
    });
  }

  function pushSymptomsHistory(queue, name, symptom) {
    return new Promise(function (resolve, reject) {
      var msg = [];
      if (symptom.rank) {
        var leaf = name + ".symptomsHistory.scales[" + symptom.text + "]";

        msg.push({
          name : leaf + ".label",
          value: symptom.name,
          type : "string"
        });
        for (var i = 0, l = symptom.history.length; i < l; i++) {
          msg.push({
            name : leaf + ".values[" + i + "].datetime",
            value: moment(symptom.history[i].datetime).unix(),
            type : "integer"
          });
          msg.push({
            name : leaf + ".values[" + i + "].value",
            value: symptom.history[i].value,
            type : "double"
          });
        }
        queue.postMsg(msg)
          .then(function () {
            resolve(msg);
          });
      } else {
        resolve(msg);
      }
    });
  }

  /**
   * Send a questionnaire history to the box
   * only questionnaire that have a TVLabel are pushed
   *
   * @param questionnaire
   * @param newFlag
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|l|Dn}
   */
  this.sendQuestionnaire = function (questionnaire, newFlag) {
    var that = this;

    var queue = new Queue(this._id);
    var name = "hhr[" + this._id + "]";

    return new Promise(function (resolve, reject) {
      var msgs = [];
      that.getHistoryDataList()
        .then(function (history) {
          var promises = history.questionnaire.map(function (quest) {
            return pushQuestionnaire(queue, name, quest);
          });
          RSVP.all(promises)
            .then(function (results) {
              logger.debug("questionnaire history pushed");
              resolve(msgs.concat(results));
            });
        });
    });
  };

  this.pushHistoryMeasures = function (history, queue, leaf) {
    return new Promise(function (resolve, reject) {
      var msgs = [];

      queue.delMsg([{branch: leaf + ".measuresHistory"}])
        .then(function () {
          logger.trace("measuresHistory cleared");
          var promises = history["General"].map(function (param) {
            return pushParam(queue, leaf, param);
          });
          return RSVP.all(promises);
        })
        .then(function (results) {
          logger.debug("General history pushed");
          msgs = msgs.concat(results);
          var promises = history["HDIM"].map(function (param) {
            return pushParam(queue, leaf, param);
          });
          return RSVP.all(promises);
        })
        .then(function (results) {
          logger.debug("HDIM history pushed");
          msgs = msgs.concat(results);
          resolve(msgs);
        });
    });
  };

  this.pushHistorySymptoms = function (history, queue, leaf) {
    logger.trace("pushHistorySymptoms");

    return new Promise(function (resolve, reject) {
      var msgs = [];

      queue.delMsg([{branch: leaf + ".symptomsHistory"}])
        .then(function () {
          logger.trace("symptoms history cleared");
          var promises = history.symptom.map(function (param) {
            return pushSymptomsHistory(queue, leaf, param);
          });
          return RSVP.all(promises);
        })
        .then(function (results) {
          logger.debug("symptom history pushed");
          msgs = msgs.concat(results);
          resolve(msgs);
        });
    });
  };

  this.pushHistoryQuestionnaires = function (history, queue, leaf) {
    return new Promise(function (resolve, reject) {
      var msgs = [];

      var promises = history.questionnaire.map(function (param) {
        return pushQuestionnaire(queue, leaf, param);
      });
      RSVP.all(promises)
        .then(function (results) {
          results.forEach(function (res) {
            if (res.length) {
              msgs.push(res);
            }
          });
          resolve(msgs);
        });
    });
  };

  /**
   * push measures history ( the last 5 measures of each parameters ) to the box
   *
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|l|Dn}
   */
  this.pushHistory = function (category) {
    var that = this;

    var queue = new Queue(this._id);
    var name = "hhr[" + this._id + "]";

    return new Promise(function (resolve, reject) {
      var msgs = [];
      that.getHistoryDataList()
        .then(function (history) {
          switch (category) {
            case "measures":
              logger.trace("pushHistory measures");
              that.pushHistoryMeasures(history, queue, name)
                .then(resolve);
              break;
            case "symptoms":
              logger.trace("pushHistory symptoms");
              that.pushHistorySymptoms(history, queue, name)
                .then(resolve);
              break;
            case "questionnaires":
              logger.trace("pushHistory questionnaires");
              that.pushHistoryQuestionnaires(history, queue, name)
                .then(resolve);
              break;
            default:
              logger.trace("pushHistory all");
              that.pushHistoryMeasures(history, queue, name)
                .then(function (results) {
                  msgs = msgs.concat(results);
                  return that.pushHistorySymptoms(history, queue, name);
                })
                .then(function (results) {
                  msgs = msgs.concat(results);
                  return that.pushHistoryQuestionnaires(history, queue, name);
                })
                .then(function (results) {
                  msgs = msgs.concat(results);
                  resolve(msgs);
                })
                .catch(function (err) {
                  logger.warning(err);
                  reject(err);
                });
          }
        });
    });
  };

  /**
   * Push the last DHD-FFQ (Eetscore) to the box
   *
   * @param newFlag
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|l|Dn}
   */
  this.pushLastDHDFFQ = function (newFlag) {
    var that = this;
    var queue = new Queue(this._id);
    var leaf = "hhr[" + this._id + "].dhdffq";

    logger.trace("pushLastDHDFFQ");
    return new Promise(function (resolve, reject) {
      var search = {category: "questionnaire", text: "DHD-FFQ", subject: that._id};
      physioDOM.db.collection("dataRecordItems").find(search).sort({datetime: -1}).limit(1).toArray(function (err, quests) {
        if (quests.length) {
          var Questionnaire = require("./questionnaire.js");
          var QuestionnaireAnswer = require("./questionnaireAnswer.js");
          var questionnaire = new Questionnaire();
          var answer = new QuestionnaireAnswer();
          queue.delMsg([{branch: leaf}])
            .then(function () {
              return questionnaire.getByRef("DHD-FFQ");
            })
            .then(function (questionnaire) {
              answer.getById(new ObjectID(quests[0].ref))
                .then(function (answer) {
                  /*
                   dhdffq.advice
                   dhdffq.new
                   dhdffq.subscores[id].label
                   dhdffq.subscores[id].value
                   */
                  var msg = [];

                  msg.push({
                    name : leaf + ".advice",
                    value: quests[0].comment ? quests[0].comment : " ",
                    type : "string"
                  });
                  msg.push({
                    name : leaf + ".new",
                    value: quests[0].transmit ? 0 : 1,
                    type : "integer"
                  });
                  for (var i = 0, l = answer.questions.length; i < l; i++) {
                    msg.push({
                      name : leaf + ".subscores[" + i + "].label",
                      value: questionnaire.questions[i].label[physioDOM.lang],
                      type : "string"
                    });
                    msg.push({
                      name : leaf + ".subscores[" + i + "].value",
                      value: answer.questions[i].choice,
                      type : "double"
                    });
                  }
                  queue.postMsg(msg)
                    .then(function () {
                      quests[0].transmit = moment().toISOString();
                      physioDOM.db.collection("dataRecordItems").save(quests[0], function () {
                        resolve(msg);
                      });
                    });
                })
                .catch(function (err) {
                  logger.error("cant get the answer");
                  resolve(false);
                });
            });
        } else {
          resolve(false);
        }
      });
    });
  };

  /**
   * push the whole physical plan and history to the queue
   *
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|Dn}
   */
  this.physicalPlanToQueue = function (force) {
    logger.trace("physicalPlanToQueue");
    var that = this;

    var physicalPlan = new PhysicalPlan(that._id);
    return physicalPlan.pushPhysicalPlanToQueue(force);
  };

  /**
   * Push a dietary advice to the BOX
   *
   * @param {dietaryPlan} dietaryPlan the recommandation to send
   * @param {boolean} newFlag  set to true if it's a new advice
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|Dn}
   */
  this.pushDietaryPlanToQueue = function (dietaryPlan, newFlag) {
    logger.trace("pushDietaryPlanToQueue");
    logger.debug(dietaryPlan);

    var queue = new Queue(this._id);
    var name = "hhr[" + this._id + "].dietary";

    return new Promise(function (resolve, reject) {
      var msg = [];
      if (newFlag) {
        msg.push({
          name : name + ".recommendations.new",
          value: 1,
          type : "integer"
        });
      }
      msg.push({
        name : name + ".recommendations.history[" + dietaryPlan._id + "].datetime",
        value: moment(dietaryPlan.datetime).unix(),
        type : "integer"
      });
      msg.push({
        name : name + ".recommendations.history[" + dietaryPlan._id + "].description",
        value: dietaryPlan.content,
        type : "string"
      });
      logger.debug("msg to send", msg);
      queue.postMsg(msg)
        .then(function () {
          resolve(msg);
        });
    });
  };

  /**
   * Push the whole dietary plan to the queue
   *
   * @returns {$$rsvp$Promise$$default|RSVP.Promise|*|Dn}
   */
  this.dietaryPlanToQueue = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
      var dietaryPlan = new DietaryPlan(that._id);
      dietaryPlan.getItemsArray(1, 1000)
        .then(function (results) {
          var promises = results.map(function (dietaryPlan) {
            return that.pushDietaryPlanToQueue(dietaryPlan);
          });
          RSVP.all(promises)
            .then(function (results) {
              resolve([].concat(results));
            });
        });
    });
  };

  this.pushFirstName = function () {
    var that = this;
    var queue = new Queue(this._id);
    return new Promise(function (resolve, reject) {
      logger.trace("pushFirstName ", that.name.given || that.name.family);
      var msg = [];
      msg.push({
        name : "hhr[" + that._id + "].firstName",
        value: that.name.given || that.name.family,
        type : "string"
      });
      if (that.size) {
        msg.push({
          name : "hhr[" + that._id + "].height",
          value: that.size * 100,
          type : "integer"
        });
      }
      queue.postMsg(msg)
        .then(function () {
          resolve(msg);
        });
    });
  };

  this.pushMessages = function () {
    var messages = new Messages(this._id);
    return messages.pushMessages();
  };
}

module.exports = Beneficiary;
