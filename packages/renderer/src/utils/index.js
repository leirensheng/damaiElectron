import {refreshDns} from '#preload';
import {ElNotification} from 'element-plus';
import axios from 'axios';
import {useStore} from '/@/store/global';
import {storeToRefs} from 'pinia';
const socketURL = 'ws://127.0.0.1:5000/socket/';
let sleep = time =>
  new Promise(r => {
    setTimeout(r, time);
  });

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
    return ip;
  } catch (e) {
    ElNotification({
      title: 'DNS更新出错',
      type: 'error',
    });
  }
};

let startCmdWithPidInfo = ({cmd, successMsg = '信息获取完成', isSuccessClose, isStopWhenLogin}) => {
  return new Promise((resolve, reject) => {
    axios
      .get('http://127.0.0.1:5000/terminal')
      .then(res => res.data.data)
      .then(pid => {
        console.log('新增进程:' + pid);
        let ws = new WebSocket(socketURL + pid);
        let closePid = () => axios.get('http://127.0.0.1:5000/close/' + pid);

        ws.onmessage = ({data}) => {
          if (data.includes(successMsg)) {
            ws.close();
            resolve({pid});
            if (isSuccessClose) {
              closePid();
            }
          } else if (data.includes('需要手机验证码')) {
            if (isStopWhenLogin) {
              ws.close();
              closePid();
              resolve({});
            } else {
              ws.close();
              resolve({pid});
            }
          } else {
            let res = data.match(/不正确|目标没对|目标为空|没有填写|没有该用户|演出结束|主动退出/);
            if (res) {
              ws.close();
              closePid();
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

let startCmdAngGetPic = cmd => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('超时'));
    }, 25000);
    axios
      .get('http://127.0.0.1:5000/terminal')
      .then(res => res.data.data)
      .then(pid => {
        console.log('新增进程:' + pid);
        let ws = new WebSocket(socketURL + pid);
        let allData = '';
        ws.onmessage = async ({data}) => {
          allData += data.trim().replace(/[\b]$/, '');
          if (allData.match(/不正确/)) {
            reject(new Error('密码不正确'));
            ws.close();
            return;
          } else if (allData.match(/自动滑动失败/)) {
            reject(new Error('自动滑动失败, 请重试'));
            ws.close();
            return;
          } else if (allData.match(/滑动成功并直接登录好了/)) {
            resolve({
              pid,
              message: '不需验证码',
            });
            ws.close();
            return;
          } else if (allData.match(/登录完成/)) {
            if (allData.match(/没有填写观演人/)) {
              reject(new Error('没有观演人, 请先添加'));
              ws.close();
              return;
            } else if (allData.match(/没有填写收获地址/)) {
              reject(new Error('没有地址, 请先添加'));
              ws.close();
              return;
            } else if (allData.match(/信息获取完成/)) {
              resolve({
                pid,
                message: '不需验证码',
              });
              ws.close();
              return;
            }
          }
          let endPoint = '';
          let res = allData.match(/浏览器endPoint【(.*?)】/);

          if (res) {
            endPoint = res[1];
            console.log('res', endPoint);
            resolve({
              endPoint,
              pid,
            });
            ws.close();
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
let updateProxyWhiteIp = async ip => {
  if(!ip) return;
  let {
    data: {data: ips},
  } = await axios.get(
    'https://api.douyadaili.com/proxy/?service=GetWhite&authkey=APe4Ryhs0IE6DVgzIDjB&format=json',
  );
  if (ips.includes(ip)) {
    console.log('无需更新IP');
    return;
  }

  await axios.get(
    'https://api.douyadaili.com/proxy/?service=DelWhite&authkey=APe4Ryhs0IE6DVgzIDjB&format=json&white=' +
      ips.join(','),
  );
  await axios.get(
    `https://api.douyadaili.com/proxy/?service=AddWhite&authkey=APe4Ryhs0IE6DVgzIDjB&white=${ip}&format=json`,
  );
  console.log('更新白名单完成');
};
export {
  getRunningCheck,
  getRunningUser,
  getIp,
  startCmdWithPidInfo,
  sleep,
  stopCmd,
  startCmdAngGetPic,
  updateProxyWhiteIp,
};
