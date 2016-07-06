var spawn = require('child_process').spawn
var psTree = require('ps-tree');

function getChild(pid) {
  psTree(pid, function (err, children) {
    if (children.length) {
      console.log(children);
    } else {
      console.log('no children');
    }
  });
}

if (process.argv[2]) {
  // here where are in the child process
  console.log('in the child process ...');
  setTimeout(function () {
    console.log('done');
  }, 2000);
} else {
  // start the child process from the main process
  console.log('This process is pid ' + process.pid);
  var child = spawn(process.execPath, [__filename, 'child'], {stdio: 'inherit'});
  getChild(process.pid);
  child.on('close', function () {
    getChild(process.pid);
    console.log('main done');
  });
  console.log('-> done');
}
