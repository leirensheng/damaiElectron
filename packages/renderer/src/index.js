import {createApp} from 'vue';
import App from '/@/App.vue';
import cmdTerminal from '/@/components/cmdTerminal.vue';
import {setupStore} from '/@/store/index';
const app = createApp(App);
setupStore(app);
import STable from '/@/components/STable/index.vue';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
// import './useSocket';
import './global.scss';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.component('CmdTerminal', cmdTerminal);
app.component('STable', STable);

app.mount('#app');
