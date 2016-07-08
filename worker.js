'use strict';

var moment = require('moment');

process.on('message', function(m) {
  console.log(moment().format("HH:mm:ss.SSS")+' CHILD got message:', m.hello);
  // do ome stuff
  setTimeout( function() {
    process.send({ done: true });
    process.exit(0);
  }, 5000);
});

process.send({ ready: true });