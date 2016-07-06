/* jslint node:true */
"use strict";

var PhysioDOM = require("./lib/class/physiodom"),
    RSVP = require("rsvp"),
    Promise = require("rsvp").Promise;

/* global -Promise */
var physioDOM = new PhysioDOM( config );   // PhysioDOM object is global and so shared to all modules
global.physioDOM = physioDOM;

var beneficiaries;
physioDOM.Beneficiaries()
  .then(function (res) {
    beneficiaries = res;
    return beneficiaries.getAllActiveHHR();
  })
  .then(function (activeBeneficiaries) {
    var promises = activeBeneficiaries.map(function (beneficiary) {
      return new Promise(function (resolve, reject) {
        beneficiaries.getHHR(beneficiary._id)
          .then(function (beneficiary) {
            beneficiary.getSymptomsPlan(false)
              .then(function () {
                return beneficiary.getMeasurePlan(false);
              })
              .then(function() {
                var startDate = moment().format("YYYY-MM-DD");
                return beneficiary.services().getServicesQueueItems( startDate, 15, physioDOM.lang );
              })
              .then(function() {
                return beneficiary.services().pushServicesToQueue( );
              })
              .then(resolve);
          });
      });
    });

    RSVP.all(promises)
      .then(function () {
        logger.info("push plans end");
        done();
      });
  });

