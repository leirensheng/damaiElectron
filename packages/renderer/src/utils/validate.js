/**
 * Created by PanJiaChen on 16/11/18.
 */

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path);
}

/**
 * @param {string} url
 * @returns {Boolean}
 */
export function validURL(url) {
  const reg =
    /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return reg.test(url);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validLowerCase(str) {
  const reg = /^[a-z]+$/;
  return reg.test(str);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUpperCase(str) {
  const reg = /^[A-Z]+$/;
  return reg.test(str);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validAlphabets(str) {
  const reg = /^[A-Za-z]+$/;
  return reg.test(str);
}

/**
 * @param {string} email
 * @returns {Boolean}
 */
export function validEmail(email) {
  const reg =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return reg.test(email);
}

/**
 * 验证手机号码
 * @param {*} rule
 * @param {*} value
 * @param {*} callback
 */
export function validMobilePhone(rule, value, callback) {
  if (value !== '') {
    const reg = new RegExp('^1[3456789]\\d{9}$');
    if (!reg.test(value)) {
      callback(new Error('请输入有效的手机号码'));
    }
  }
  callback();
}

/**
 * 验证座机或手机号码
 * @param {*} rule
 * @param {*} value
 * @param {*} callback
 */
export function validTelephone(rule, value, callback) {
  if (value !== '') {
    const reg = new RegExp('^((0\\d{2,3}-\\d{7,8})|(1[3584]\\d{9}))$');
    if (!reg.test(value)) {
      callback(new Error('请输入正确的手机号或者座机号(格式为：0000-0000000)'));
      return;
    }
  }
  callback();
}

/**
 * 验证密码，只能输入英文大小写，数字和下划线
 * @param {*} rule
 * @param {*} value
 * @param {*} callback
 */
export function validPassword(rule, value, callback) {
  if (value === '') {
    callback(new Error('请输入密码'));
  } else {
    const reg = new RegExp('^(\\w){6,20}$');
    if (!reg.test(value)) {
      callback(new Error('密码只能输入6-20字符英文大小写字母，数字和下划线'));
    } else {
      callback();
    }
  }
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function isString(str) {
  if (typeof str === 'string' || str instanceof String) {
    return true;
  }
  return false;
}

/**
 * @param {Array} arg
 * @returns {Boolean}
 */
export function isArray(arg) {
  if (typeof Array.isArray === 'undefined') {
    return Object.prototype.toString.call(arg) === '[object Array]';
  }
  return Array.isArray(arg);
}

/**
 * 验证是否[1-99]整数
 * @param {*} rule
 * @param {*} value
 * @param {*} callback
 */
export function isInteger(rule, value, callback) {
  if (value !== '') {
    const reg = new RegExp('^[1-9][0-9]{0,1}$');
    if (!reg.test(value)) {
      callback(new Error('请输入1-99的正整数'));
    }
  }
  callback();
}

/**
 * 验证是否大写字母
 * @param {*} rule
 * @param {*} value
 * @param {*} callback
 */
export function isUpperCase(rule, value, callback) {
  if (value !== '') {
    const reg = new RegExp('^[A-Z]+$');
    if (!reg.test(value)) {
      callback(new Error('请输入大写字母'));
    }
  }
  callback();
}
