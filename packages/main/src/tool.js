const {exec} = require('child_process');

let cmd = ({cmd, successStr, failStr, isSuccessStop}) =>
  new Promise((resolve, reject) => {
    let data = '';
    let child = exec(cmd);
    child.stdout.on('data', cur => {
      data += cur;
      if (data.includes(failStr)) {
        reject();
      } else if (data.includes(successStr)) {
        resolve();
        if (isSuccessStop) {
          cmd('taskkill /T /F /PID ' + child.pid);
        }
      }
    });
    child.stderr.on('data', data => {
      console.log(data);
      reject();
    });
  });

let startServer = async () => {
  try {
    await cmd({
      cmd: 'pm2 restart slideServer && pm2 restart damai',
      failStr: "doesn't exist",
      successStr: 'Applying action restartProcessId on app',
      isSuccessStop: false,
    });
  } catch (e) {
    await cmd({
      cmd: 'cd ../slideServer && pm2 start slideServer && cd ../damaiServer && pm2 start damai',
    });
  }
};

export {startServer};
