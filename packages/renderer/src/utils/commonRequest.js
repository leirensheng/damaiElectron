/* eslint-disable no-param-reassign */
import {ElMessage, ElNotification} from 'element-plus';
import store from '@/store';
import router from '@/router';
import {getToken, setToken} from '@/utils/auth';

const notAddToken = [/report/i, /analyses/i];
const generateCommonRequest = service => {
  service.interceptors.request.use(
    config => {
      if (store.state.token && !notAddToken.some(regexp => regexp.test(window.location.href))) {
        config.headers.Authorization = getToken();
      }
      const {url, waitPre, baseURL} = config;
      if (waitPre) {
        const realUrl = url.replace(baseURL, '');
        config.realUrl = realUrl;
      }
      return config;
    },
    error => Promise.reject(error),
  );

  service.interceptors.response.use(
    response => {
      const res = response.data;
      const {headers} = response;
      const {config} = response;
      if (headers.refreshtoken) {
        const newToken = headers.refreshtoken;
        store.commit('SET_TOKEN', newToken);
        setToken(newToken);
      }
      if (config.noHandleCode) {
        return res;
      }
      const {code, data, msg} = res;

      if (code === 0) {
        return data;
      }
      if (code === 10005) {
        ElNotification({
          type: 'warning',
          title: '提示',
          message: msg,
        });
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(10005);
      }
      ElMessage({
        message: msg || '未知错误',
        type: 'error',
        duration: 5 * 1000,
      });
      return Promise.reject();
    },
    error => {
      const body = JSON.parse(JSON.stringify(error));
      const {response} = body;
      if (
        response.headers['x-token-expired'] &&
        response.headers['x-token-expired'] === 'expired'
      ) {
        ElMessage({
          message: '登录信息已失效，请重新登录',
          type: 'error',
          duration: 5 * 1000,
        });

        store.dispatch('resetToken');
        router.replace('/login');
        return Promise.reject(error);
      }
      const httpStatusCode = response && response.status ? response.status : '';

      const {code} = body;
      let msg = '';
      if (httpStatusCode) {
        const map = {
          403: '您没有权限访问此资源',
          404: '请求地址未映射',
          500: '网络异常，请重试',
        };
        msg = map[httpStatusCode];
      }

      if (code && code === 'ECONNABORTED') {
        msg = '服务响应超时，请重试';
      }

      ElMessage({
        message: msg || '未知错误',
        type: 'error',
        duration: 5 * 1000,
      });
      return Promise.reject(error);
    },
  );

  return async function myRequest(...args) {
    return service(...args);
  };
};

export default generateCommonRequest;
