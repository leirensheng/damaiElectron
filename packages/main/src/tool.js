const shell = require('shelljs');

export function cmd(str, cb) {
  let val = 'cd ../damai &&' + str;
  var child = shell.exec(val, {async: true, silent: true});
  if (cb) {
    child.stdout.on('data', cb);
    child.stderr.on('data', cb);
    child.stdout.on('end', () => {
      cb('done');
    });
  }
  child.close = () => {
    cmd('taskkill /T /F /PID ' + child.pid);
  };
  return child;
}
