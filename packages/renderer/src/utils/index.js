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

let startCmdWithPidInfo = (cmd, successMsg = '信息获取完成', isFromRemote) => {
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
          } else if (data.includes('需要登陆') || data.includes('at ')) {
            //报错会出现at
            ws.close();
            if(isFromRemote){
              resolve({pid,msg:'需要登录, 请远程登录'});
            }else{
              axios.get('http://127.0.0.1:5000/close/' + pid);
              reject(new Error(cmd + '需要登录或报错'));
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


export {
  getRunningCheck,
  getRunningUser,
  getIp,
  startCmdWithPidInfo,
  sleep,
  stopCmd,
};
