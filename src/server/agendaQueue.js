/* jslint node:true */
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

/* global -Promise */

var PhysioDOM = require("./lib/class/physiodom"),
    Logger  = require("logger"),
    RSVP = require("rsvp"),
    moment = require('moment'),
    Promise = require("rsvp").Promise;

var logger = new Logger( "PhysioDOM Worker");
var physioDOM = null;

process.on('message', function(m) {
  switch(m.event) {
    case 'config':
      logger.trace('init');
      physioDOM = new PhysioDOM( m.config );
      physioDOM.connect()
        .then( function() {
          global.physioDOM = physioDOM;
          process.send({event:'ready'});
        })
        .catch(function() {
          logger.emergency('==================================================================');
          logger.emergency("Wordker connection to database failed");
          logger.emergency("HHR-Pro instance not started");
          logger.emergency('==================================================================');
          process.send({event:'error'});
        });
      break;
    case 'doPush':
      logger.trace('doPush event');
      doPush(m.force)
        .then(function() {
          console.log('all stuff done');
        })
        .catch(function(err) {
          console.log('Houston, there\'s a problem');
          console.log(err);
        });
      break;
    default:
      console.log("get message", m);
  }
});

process.send({ event: 'started' });

function doPush(force) {
  var beneficiaries;
  
  return physioDOM.Beneficiaries()
    .then(function (res) {
      beneficiaries = res;
      return beneficiaries.getAllActiveHHR();
    })
    .then(function (activeBeneficiaries) {
      logger.debug('get active beneficiaries', activeBeneficiaries.length );
      
      var promises = activeBeneficiaries.map(function (record) {
        return function() {
          return new Promise(function (resolve, reject) {
            var beneficiary = null;

            beneficiaries.getHHR(record._id)
              .then(function (res) {
                beneficiary = res;
                return beneficiary.getSymptomsPlan(force);
              })
              .then(function () {
                return beneficiary.getMeasurePlan(force);
              })
              .then(function () {
                var startDate = moment().format("YYYY-MM-DD");
                return beneficiary.services().getServicesQueueItems(startDate, 15, physioDOM.lang);
              })
              .then(function () {
                return beneficiary.services().pushServicesToQueue();
              })
              .then(resolve)
              .catch( function(err) {
                logger.error('catch an error');
                console.log(err);
              });
          });
        };
      });

      function runSerial(tasks) {
        var result = Promise.resolve();
        tasks.forEach( function(task) {
          result = result.then( function() { task() });
        });
        return result;
      }
      
      Promise.resolve()
        .then( function() {
          return runSerial( promises );
        })
        .then( function() {
          logger.info("push plans end");
        });
      
    });
}

