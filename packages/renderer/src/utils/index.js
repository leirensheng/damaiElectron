import {refreshDns} from '#preload';
import {ElNotification} from 'element-plus';
import axios from 'axios';
import {useStore} from '/@/store/global';
import {storeToRefs} from 'pinia';

export function debounce(fn, time = 2500) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call(this, ...args);
    }, time);
  };
}

let getRunningCheck = pidInfo => {
  let cmds = Object.keys(pidInfo).filter(one => one.includes('npm run check'));
  let res = [];
  cmds.forEach(cmd => {
    let regRes = cmd.match(/check(Many)? [\d-]+ (\d+-\d+)/);
    if (regRes) {
      let [start, end] = regRes[2].split('-');
      let isNotData = cmd.includes('useNot');

      let startWith = isNotData ? 'not_data' : 'data';
      let length = end - start + 1;
      let arr = Array.from({length}, (_, index) => startWith + (index + Number(start)));
      res = [...res, ...arr];
    }
  });
  return res;
};

let getRunningUser = pidInfo => {
  let cmds = Object.keys(pidInfo).filter(one => one.includes('npm run start'));
  let res = cmds.map(cmd => cmd.match(/npm run start (.*?)(\s|$)/)[1]);
  return res;
};

let getIp = async () => {
  try {
    let ip = await refreshDns();
    ElNotification({
      title: 'DNS更新成功',
      message: ip,
      type: 'success',
    });
  } catch (e) {
    ElNotification({
      title: 'DNS更新出错',
      type: 'error',
    });
  }
};

let startCmdWithPidInfo = (cmd, successMsg = '信息获取完成', isSuccessClose) => {
  return new Promise((resolve, reject) => {
    const socketURL = 'ws://127.0.0.1:5000/socket/';
    axios
      .get('http://127.0.0.1:5000/terminal')
      .then(res => res.data.data)
      .then(pid => {
        console.log('新增进程:' + pid);
        let ws = new WebSocket(socketURL + pid);
        ws.onmessage = ({data}) => {
          if (data.includes(successMsg)) {
            ws.close();
            resolve({pid});
            if(isSuccessClose){
              axios.get('http://127.0.0.1:5000/close/' + pid);
            }
          } else {
            let res = data.match(/不正确|目标没对|目标为空|没有填写/);
            if (res) {
              ws.close();
              axios.get('http://127.0.0.1:5000/close/' + pid);
              reject(new Error(cmd + res[0]));
            }
          }
        };
        ws.onopen = () => {
          ws.send(`${cmd} \r\n`);
        };
      });
  });
};

let stopCmd = async cmd => {
  let store = useStore();
  let {setPidInfo} = store;
  let {pidInfo} = storeToRefs(store);
  let pid = pidInfo[cmd];
  await axios.get('http://127.0.0.1:5000/close/' + pid);
  delete pidInfo[cmd];
  setPidInfo({...pidInfo});
};

let sleep = time =>
  new Promise(r => {
    setTimeout(r, time);
  });

export {getRunningCheck, getRunningUser, getIp, startCmdWithPidInfo, sleep, stopCmd};
