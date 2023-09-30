const fs = require('fs');
const path = require('path');
let getDynv6Ip = require('../../../../xiudongPupp/getDynv6Ip');

import cmd from './cmd.js';
// import  './useClient.js';
export {cmd};
export function readFile(name,isElectron) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(isElectron?'./':'../damai', name), 'utf-8', (e, res) => {
      if (e) {
        reject(e);
        return;
      }
      resolve(res);
    });
  });
}

export function writeFile(name, data, isElectron) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(isElectron?'./': '../damai', name), data, e => {
      if (e) {
        reject(e);
        return;
      }
      resolve();
    });
  });
}

export function readDir(name) {
  return new Promise((resolve, reject) => {
    fs.readdir(path.resolve('../damai', name), (e, data) => {
      if (e) {
        reject(e);
        return;
      }
      resolve(data);
    });
  });
}

export function rename(dir, newName) {
  return new Promise((resolve, reject) => {
    let fs = require('fs');
    let file = path.resolve('../damai', dir);
    let newFile = path.resolve('../damai', newName);

    fs.rename(file, newFile, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function rmDir(dir) {
  let util = require('util');
  let stat = util.promisify(fs.stat);
  let readdir = util.promisify(fs.readdir);
  let rmdir = util.promisify(fs.rmdir);
  let unlink = util.promisify(fs.unlink);

  let realDir = path.resolve('../damai', dir);
  async function removeDir(p) {
    let statObj = await stat(p);
    if (statObj.isDirectory()) {
      let dirs = await readdir(p);
      dirs = dirs.map(dir => path.join(p, dir));
      let promises = dirs.map(dir => removeDir(dir));
      await Promise.all(promises);
      await rmdir(p);
    } else {
      // 要等待文件删除后 才让promise执行完 所以需要await
      await unlink(p);
    }
  }
  await removeDir(realDir);
}

export function getComputerName() {
  let os = require('os');
  let map = {
    'DESKTOP-AAKRGOM': '宏基',
    CCRPC028: '惠普',
    'DESKTOP-43': '虚拟机4.3',
    'DESKTOP-3ML3QTF': '虚拟机4.4',
    'DESKTOP-U1N2FOL': '联想',
    'DESKTOP-STTL34E': '新电脑',
  };
  let hostname = os.hostname();
  return map[hostname] || hostname;
}

export function readClip() {
  let {clipboard} = require('electron');
  return clipboard.readText().trim().replace('尊敬的用户，你的UID是：', '');
}
export function copyText(str) {
  let {clipboard} = require('electron');
  return clipboard.writeText(str);
}

export function sendMsgToMain(eventName, val) {
  const {ipcRenderer} = require('electron');
  ipcRenderer.send(eventName, val);
}


export function getContentLength(formData) {
  return new Promise((resolve, reject) => {
    formData.getLength(async (err, length) => {
      if (err) {
        reject(err);
      }
      resolve(length);
    });
  });
}

export function zip(dest, zipPath) {
  let AdmZip = require('adm-zip');
  const file = new AdmZip();
  // 压缩文件夹
  file.addLocalFolder(dest);
  console.time();
  file.writeZip(zipPath);
  console.timeEnd();
}

export function unZip(dest, name) {
  let AdmZip = require('adm-zip');
  let filePath = path.resolve(dest, name + '.zip');
  const admzip = new AdmZip(filePath);
  admzip.extractAllTo(path.resolve(dest, name));
  fs.unlinkSync(filePath);
}

export async function cloneRemoteConfig(username, data) {
  let config = await readFile('config.json');
  config = JSON.parse(config);
  config[username] = data;
  await writeFile('config.json', JSON.stringify(config, null, 4));
}

export function getRemoteIp(name) {
  let pcName = getComputerName();
  let map = {
    新电脑: pcName.includes('虚拟机')
      ? '192.168.4.1'
      : pcName === '联想'
      ? '192.168.5.1'
      : 'mticket.ddns.net',
    '虚拟机4.3': ['虚拟机4.4', '新电脑'].includes(pcName) ? '192.168.4.3' : '100.95.67.33',
    '虚拟机4.4': ['虚拟机4.3', '新电脑'].includes(pcName) ? '192.168.4.4' : '100.116.129.127',
    联想: '192.168.5.2',
    惠普: '100.115.170.87',
    宏基: 'e4097n6449.51vip.biz',
  };
  return map[name];
}

export function doTwice(fn, host) {
  return async (...args) => {
    let res = await readFile('localConfig.json');
    let {dnsIp} = JSON.parse(res);

    if (host.includes('mticket.ddns.net') && dnsIp) {
      try {
        res = await fn(dnsIp, ...args);
      } catch (e) {
        res = await fn(host, ...args);
      }
    } else {
      res = await fn(host, ...args);
    }
    return res;
  };
}

export async function refreshDns() {
  let ip = await getDynv6Ip();
  let configStr = await readFile('localConfig.json');
  let config = JSON.parse(configStr);
  let oldIp = config.dnsIp;
  configStr = configStr.replaceAll(oldIp, ip);
  await writeFile('localConfig.json', configStr);
  return ip;
}

export async function savePidInfo(json) {
  await writeFile('pidInfo.json', json, true);
}

export async function getPidInfoFromFile() {
  let res= await readFile('pidInfo.json',  true);
  return JSON.parse(res);
}
