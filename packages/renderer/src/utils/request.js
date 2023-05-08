import axios from 'axios';
import commonRequest from './commonRequest';

const service = axios.create({
  baseURL: '/dc-admin-server',
  timeout: 50000,
});

export default commonRequest(service);
