'use strict';

var fork = require('child_process').fork;
var moment = require('moment');

console.log( moment().format("HH:mm:ss.SSS")+' start worker');
var worker = fork('./worker');
console.log(moment().format("HH:mm:ss.SSS")+' worker '+worker.pid);

worker.on('message', function(m) {
  console.log(moment().format("HH:mm:ss.SSS")+' PARENT GET :', m);
  console.log(moment().format("HH:mm:ss.SSS")+' worker '+this.pid);
});

worker.send({ hello: 'world' });