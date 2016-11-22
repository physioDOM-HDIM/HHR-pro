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
 * @file IBeneficiary.js
 * @module Http
 */

/* jslint node:true */
/* global physioDOM */
"use strict";

var Logger = require("logger"),
  ObjectID = require("mongodb").ObjectID,
  Queue = require("../class/queue.js"),
  moment = require("moment");
var logger = new Logger("IQueue");

/**
 * IBeneficiaries
 *
 * treat http request for beneficiaries
 */
var IQueue = {

  /**
   * Init the hhr for the selected patient
   *
   * @param req
   * @param res
   * @param next
   */
  init: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("symptomPlan", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }
    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      var queue = new Queue(hhr);
      queue.init()
        .then(function (response) {
          res.send(200, {code: 200, message: "init for " + hhr + " sent"});
          next();
        })
        .catch(function (err) {
          logger.error("error ", err);
          res.send(err.code || 400, err);
          next(false);
        });
    }
  },

  status: function (req, res, next) {
    logger.trace("status");
    try {
      var msg = JSON.parse(req.body.toString());
      logger.debug("status msg :", msg);
      var queue = new Queue(new ObjectID(msg.subject));
      queue.status(msg)
        .then(function () {
          res.send(200);
          next();
        })
        .catch(function (err) {
          res.send(500 || err.code, err.message);
          next(false);
        });
    } catch (err) {
      res.send(400);
      next(false);
    }
  },

  firstname: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("firstname", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.pushFirstName();
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end sending messages");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("firstname error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  messages: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("messages", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.pushMessages();
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end sending messages");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("messages error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  history: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("history", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.pushHistory(req.params.category);
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end sending history");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("history error", err);
          console.log(err.stack);
          throw err;
        });
      ;
    }
  },

  dhdffq: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("dhdffq", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.pushLastDHDFFQ();
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end dhdffq");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("dhdffq error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  measurePlan: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    var force = req.params.force !== null && req.params.force !== "true" ? false : true;
    logger.trace("measurePlan", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      logger.warning("you have no right to access this request");
      res.send(403, {code: 403, message: "you have no right to access this request"});
      return next(false);
    }

    if (!hhr) {
      logger.warning("no hhr given");
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus === true) {
            return beneficiary.getMeasurePlan(force);
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end measure plan");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("measurePlan error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  /**
   * Send the services lists by category to HHR-Home
   *
   * @param req
   * @param res
   * @param next
   */
  services: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    var queue;
    logger.trace("servicesPlan", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      logger.warning("you have no right to access this request");
      res.send(403, {code: 403, message: "you have no right to access this request"});
      return next(false);
    }

    if (!hhr) {
      logger.warning("no hhr given");
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus === true) {
            queue = new Queue(beneficiary._id);
            return beneficiary.services().pushServicesToQueue();
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end service lists");
          res.send(result);
          next();
        })
        .catch(function (err) {
          if (err.stack) {
            console.log(err.stack);
          } else {
            console.log(err);
          }
          res.send({code: 500, message: "error when pushing services to queue"});
          next();
        });
    }
  },

  /**
   * Send the agenda to HHR-Home
   *
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  servicesPlan: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;

    logger.trace("servicesPlan", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      logger.warning("you have no right to access this request");
      res.send(403, {code: 403, message: "you have no right to access this request"});
      return next(false);
    }

    if (!hhr) {
      logger.warning("no hhr given");
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus === true) {
            var startDate = moment().add(1, 'd').format("YYYY-MM-DD");
            return beneficiary.services().getServicesQueueItems(startDate, 31, physioDOM.lang);
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end service agenda");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("servicesPlan error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  symptomsSelf: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("symptomsSelf", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.symptomsSelfToQueue();
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end symptomsSelf");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("symptomsSelf error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  symptomPlan: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    var force = req.params.force !== null && req.params.force !== "true" ? false : true;
    logger.trace("symptomPlan", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.getSymptomsPlan(force);
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end symptoms plan");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("symptomPlan error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  physicalPlan: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("physicalPlan", hhr);
    var force = req.params.force === "true" ? true : false;

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.physicalPlanToQueue(force);
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end physical plan");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("physicalPlan error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  dietaryPlan: function (req, res, next) {
    var hhr = req.params.hhr ? new ObjectID(req.params.hhr) : null || req.session.beneficiary;
    logger.trace("dietaryPlan", hhr);

    if (["administrator", "coordinator"].indexOf(req.session.role) === -1) {
      res.send(403, {code: 403, message: "you have no write to access this request"});
      return next(false);
    }

    if (!hhr) {
      res.send(404, {code: 404, message: "empty hhr"});
      return next();
    } else {
      physioDOM.Beneficiaries()
        .then(function (beneficiaries) {
          return beneficiaries.getHHR(hhr);
        })
        .then(function (beneficiary) {
          if (beneficiary.biomasterStatus) {
            return beneficiary.dietaryPlanToQueue();
          } else {
            return false;
          }
        })
        .then(function (result) {
          logger.debug("end dieatry plan");
          if (result) {
            res.send(result);
          } else {
            res.send({code: 200, message: "biomaster not initialized"});
          }
          next();
        })
        .catch(function (err) {
          console.log("dietaryPlan error", err);
          console.log(err.stack);
          throw err;
        });
    }
  },

  /**
   * Receive a POST message from SServer
   *
   * @param req  the POST request
   * @param res  response object
   * @param next restify callback
   */
  receivedMsg: function (req, res, next) {
    logger.trace("receivedMsg");

    try {
      var msg = JSON.parse(req.body.toString());
      logger.info("receivedMsg", msg.type, msg.message.hhr);
      var queue = new Queue(new ObjectID(msg.message.hhr));
      queue.receivedMessages(msg)
        .then(function () {
          res.send(200, {code: 200, message: "received message type " + msg.type});
          next();
        })
        .catch(function (err) {
          if (err.stack) {
            console.log(err.stack);
          }
          logger.warning(err);
          res.send(500);
          next();
        });
    } catch (err) {
      res.send(405, {code: 405, message: "bad json format"});
      next();
    }
  }

};

module.exports = IQueue;