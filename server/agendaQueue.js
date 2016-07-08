/* jslint node:true */
"use strict";
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
      var promises = activeBeneficiaries.map(function (beneficiary) {
        return new Promise(function (resolve, reject) {
          beneficiaries.getHHR(beneficiary._id)
            .then(function (beneficiary) {
              beneficiary.getSymptomsPlan(force)
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
                .then(resolve);
            })
            .catch( function(err) {
              logger.error('catch an error');
              console.log(err);
            });
        });
      });

      RSVP.all(promises)
        .then(function () {
          logger.info("push plans end");
        })
        .catch( function(err) {
          console.log('error catched', err);
        });
    });
}

