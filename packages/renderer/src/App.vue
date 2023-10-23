<template>
  <div class="app">
    <el-tabs
      v-model="activeName"
      class="demo-tabs"
    >
      <el-tab-pane
        v-for="({title, name}, index) in tabs"
        :key="index"
        :label="title"
        :name="name"
      >
      </el-tab-pane>
    </el-tabs>
    <div class="content">
      <component :is="activeName"></component>
    </div>
  </div>
</template>

<script>
import SearchActivity from '/@/components/searchActivity.vue';
import ConfigManage from '/@/components/configManage.vue';
import CheckMapManage from '/@/components/checkMapManage.vue';
import OrderPage from '/@/components/orderPage.vue';
import LocalConfig from '/@/components/localConfig.vue';
import RemoteConfig from '/@/components/remoteConfig.vue';

import {getIp} from './utils/index.js';
import {useStore} from '/@/store/global';
import {storeToRefs} from 'pinia';
import {savePidInfo} from '#preload';
import eventBus from '/@/utils/eventBus.js';

export default {
  components: {
    SearchActivity,
    CheckMapManage,
    ConfigManage,
    OrderPage,
    RemoteConfig,
    LocalConfig,
  },
  setup() {
    let store = useStore();
    let {pidInfo} = storeToRefs(store);
    return {pidInfo};
  },
  data() {
    return {
      activeName: 'ConfigManage',
      tabs: [
        {
          name: 'SearchActivity',
          title: '查询',
        },
        {
          name: 'CheckMapManage',
          title: 'checkMap',
        },
        {
          name: 'ConfigManage',
          title: '用户配置',
        },
        {
          name: 'LocalConfig',
          title: '本地配置',
        },
        {
          name: 'OrderPage',
          title: '订单页',
        },
 

        {
          name: 'remoteConfig',
          title: '远程配置',
        },
 
      ],
    };
  },
  watch: {
    pidInfo: {
      deep: true,
      handler(val) {
        if (!window.noSavePidInfo) {
          console.log('保存pidInfo');
          savePidInfo(JSON.stringify(val,null,4));
        }
      },
    },
  },
  created() {
    eventBus.on('switchTab', this.switchTab);

    getIp();
  },
  unmounted() {
    eventBus.off('switchTab', this.switchTab);
  },
  mounted() {},
  methods: {
    switchTab(val){
      this.activeName = val;
    },
  },
};
</script>

<style scoped lang="scss">
#terminal {
  height: 100%;
  width: 100%;
}

.app {
  background: rgb(15, 19, 32);
  height: 100vh;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .content {
    flex: 1;
    overflow: auto;
  }
}
</style>
