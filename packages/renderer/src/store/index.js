import {createPinia} from 'pinia';

const pinia = createPinia();

export const setupStore = app => {
  app.use(pinia);
};

export default pinia;
