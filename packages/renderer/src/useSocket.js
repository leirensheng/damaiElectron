// 引入 Socket.IO 客户端库
import {useStore} from '/@/store/global';
import eventBus from '/@/utils/eventBus.js';
import {startCmdWithPidInfo, startCmdAngGetPic} from '/@/utils/index.js';
import axios from 'axios';


// 连接到本地服务器

// window.socket = socket;

class MySocket {
  constructor() {
    this.heartTimer = null;
    this.connected = false;
    this.socket = null;
    this.toDisconnectedTimer = null;
    this.connect();
  }

  async connect() {
    console.log('尝试连接');
    clearInterval(this.heartTimer);
    clearTimeout(this.toDisconnectedTimer);
    if (this.socket) {
      this.socket.close();
    }

    this.connected = false;
    this.socket = new WebSocket('ws://localhost:5000/electronSocket');
    this.socket.onopen = () => {
      console.log('打开连接', this.socket);
      window.socket = this.socket;
      this.connected = true;
      this.changeToDisconnected();
      this.startHeatBeat();
      this.socket.onmessage = async ({data: str}) => {
        let data = JSON.parse(str);
        if (data.type === 'pong') {
          this.connected = true;
          this.changeToDisconnected();
        } else if (data.type === 'closePid') {
          let closePid = data.pid;
          let store = useStore();
          let {pidInfo} = store;
          for (let [cmd, pid] of Object.entries(pidInfo)) {
            console.log(cmd, pid);
            if (Number(closePid) === Number(pid)) {
              delete pidInfo[cmd];
              // eventBus.emit('getUserList');
            }
          }
        } else if (data.type === 'getConfigList') {
          eventBus.emit('getUserList');
        } else if (data.type === 'getCheckList') {
          eventBus.emit('getCheckList');
        }else if (data.type === 'startCheck') {
          let {cmd} = data;
          let store = useStore();
          let {pidInfo} = store;
          let isSuccess = false;
          let msg;
          try {
            let res = await startCmdWithPidInfo({cmd, successMsg: '开始进行'});
            pidInfo[cmd] = res.pid;
            msg = res.msg;
            isSuccess = true;
            eventBus.emit('getCheckList');
          } catch (e) {
            msg = e.message;
            console.log(e);
          }
          this.socket.send(
            JSON.stringify({
              type: 'startCheckDone',
              data: {
                isSuccess,
                msg,
              },
            }),
          );
        } else if (data.type === 'stopCheck') {
          let {cmd} = data;
          let store = useStore();
          let {pidInfo} = store;
          let pid = pidInfo[cmd];
          await axios.get('http://127.0.0.1:5000/close/' + pid);
          delete pidInfo[cmd];
          eventBus.emit('getCheckList');
          this.socket.send(
            JSON.stringify({
              type: 'stopCheckDone',
              data: {
                isSuccess: true,
              },
            }),
          );
        }else if (data.type === 'recover') {
          eventBus.emit('switchTab','ConfigManage');
          eventBus.emit('recover');
          eventBus.once('recoverDone', (failCmds)=>{
            console.log('recoverDone');
            this.socket.send(
              JSON.stringify({
                type: 'recoverDone',
                data:{
                  failCmds,
                },
              }),
            );
          });
        } else if (data.type === 'startUser') {
          let {cmd, isStopWhenLogin} = data;
          let store = useStore();
          let {pidInfo} = store;
          let isSuccess = false;
          let msg;
          let pid;
          try {
            let res = await startCmdWithPidInfo({cmd, successMsg: '信息获取完成', isStopWhenLogin});
            pidInfo[cmd] = res.pid;
            pid = res.pid;
            msg = res.msg;
            isSuccess = true;
            eventBus.emit('getUserList');
          } catch (e) {
            msg = e.message;
            console.log(e);
          }
          this.socket.send(
            JSON.stringify({
              type: 'startUserDone',
              data: {
                isSuccess,
                msg,
                pid,
              },
            }),
          );
        } else if (data.type === 'startCheckAndClose') {
          let {cmd} = data;
          try {
            await startCmdWithPidInfo({cmd, successMsg:'信息更新完成',  isSuccessClose:true});
            eventBus.emit('getCheckList');
          } catch (e) {
            console.log(e);
          }
        } else if (data.type === 'startLogin') {
          let {cmd} = data;
          let store = useStore();
          let {pidInfo} = store;
          let isSuccess = false;
          let msg;
          let pid;
          let endPoint;
          try {
            let res = await startCmdAngGetPic(cmd);
            endPoint = res.endPoint;
            pid = res.pid;
            pidInfo[cmd] = res.pid;
            isSuccess = true;
            eventBus.emit('getUserList');
          } catch (e) {
            msg = e.message;
            console.log(e);
          }
          this.socket.send(
            JSON.stringify({
              type: 'startLoginDone',
              data: {
                isSuccess,
                msg,
                pid,
                endPoint,
              },
            }),
          );
        }
      };
    };
    this.socket.onerror = async e => {
      console.log('WebSocket连接打开失败，请检查！', e);
      this.connected = false;
      // await sleep(1000);
      this.connect();
    };
  }
  changeToDisconnected() {
    clearTimeout(this.toDisconnectedTimer);
    this.toDisconnectedTimer = setTimeout(() => {
      this.connected = false;
      this.connect();
    }, 30000);
  }

  startHeatBeat() {
    clearInterval(this.heartTimer);
    this.heartTimer = setInterval(() => {
      this.socket.send(JSON.stringify({type: 'ping'}));
    }, 1000);
  }
}

new MySocket();

// window.socket = socket;
// // 监听连接成功事件
// socket.on('connect', () => {
//   console.log('连接成功！');
// });

// // 监听连接失败事件
// socket.on('connect_error', error => {
//   console.log('连接失败，错误信息：', error.message);
// });

// // 监听重连事件
// socket.on('reconnect', attemptNumber => {
//   console.log(`第 ${attemptNumber} 次重连成功！`);
// });

// // 监听重连失败事件
// socket.on('reconnect_error', error => {
//   console.log('重连失败，错误信息：', error.message);
// });

// window.socket.on('closePid', closePid => {
//   console.log('客户端收到的', closePid);
//   let store = useStore();
//   let {pidInfo} = store;
//   for (let [cmd, pid] of Object.entries(pidInfo)) {
//     console.log(cmd, pid);
//     if (Number(closePid) === Number(pid)) {
//       delete pidInfo[cmd];
//       eventBus.emit('getUserList');
//     }
//   }
// });

// window.socket.on('startUser', async cmd => {
//   console.log('客户端收到的', cmd);
//   let store = useStore();
//   let {pidInfo} = store;
//   let isSuccess = false;
//   try {
//     let pid = await startCmdWithPidInfo(cmd, '信息获取完成');
//     pidInfo[cmd] = pid;
//     isSuccess = true;
//     eventBus.emit('getUserList');
//   } catch (e) {
//     console.log(e);
//   }
//   window.socket.emit('startUserDone', isSuccess);
// });

// window.socket.on('getConfigList', async () => {
//   eventBus.emit('getUserList');
// });
