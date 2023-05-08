<template>
  <div>
    <el-form
      :form="config"
      inline
    >
      <!-- <el-form-item label="有票不提示">
        <el-switch v-model="config.noSend"></el-switch>
      </el-form-item> -->
      <!-- <el-form-item label="不自动付">
        <el-switch v-model="config.noAutoPay"></el-switch>
      </el-form-item> -->
      <el-form-item label="服务器ip">
        <el-input v-model="config.checkServerIp"></el-input>
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          @click="onSubmit"
        >
          修改
        </el-button>
      </el-form-item>
    </el-form>

    <div>
      <span
        class="show-ip"
        @click="copyText(config.dnsIp + ':5678')"
      >
        <el-icon class="copy-icon"> <DocumentCopy /> </el-icon>{{ config.dnsIp }}:5678</span
      >
      <el-button
        :loading="loadingDns"
        @click="refreshDns"
      >
        更新DNS
      </el-button>
      <el-button
        style="margin-left: 20px"
        @click="refreshIp"
      >
        更新IP
      </el-button>
    </div>
    <div>
      <cmd-terminal2
        v-if="isStart"
        ref="terminal"
        no-set-local-storage
        cmd="node updateWanIp.js"
        @message="handleMessage"
        @exit="isStart = false"
      ></cmd-terminal2>
    </div>
    <div class="server-info">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="row"
      >
        <div class="show">{{ item.name }}_{{ item.showTime }}: </div>
        <el-input
          v-model="item.ip"
          class="val"
        ></el-input>
      </div>
    </div>
  </div>
</template>

<script>
import {readFile, writeFile, copyText} from '#preload';
import {ElNotification} from 'element-plus';
import {getIp} from '../utils/index.js';
export default {
  data() {
    return {
      isStart: false,
      loadingDns: false,
      config: {},
      items: [],
    };
  },
  created() {
    this.getConfig();
  },
  beforeUnmount() {
    this.isStart && this.$refs.terminal.close();
  },
  methods: {
    copyText(str) {
      copyText(str);
      ElNotification({
        title: '成功',
        message: '复制成功',
        type: 'success',
      });
    },
    async handleMessage(val) {
      if (val.includes('成功')) {
        this.refreshDns();
        ElNotification({
          title: '成功',
          message: 'WAN ip更新成功',
          type: 'success',
        });
      }
    },

    refreshIp() {
      this.isStart = true;
    },
    async refreshDns() {
      this.loadingDns = true;
      await getIp();
      this.getConfig();
      this.loadingDns = false;
    },
    getServerInfo() {
      return this.items
        .filter(one => one.ip)
        .reduce((prev, cur) => {
          let key = cur.name + '_' + cur.activityId + '_' + cur.showTime;
          prev[key] = cur.ip;
          return prev;
        }, {});
    },
    async onSubmit() {
      let serverInfo = this.getServerInfo();

      await writeFile(
        'localConfig.json',
        JSON.stringify(
          {
            ...this.config,
            serverInfo,
          },
          null,
          4,
        ),
      );
      ElNotification({
        title: '成功',
        message: '保存成功',
        type: 'success',
      });
      this.getConfig();
    },
    async getConfig() {
      let str = await readFile('localConfig.json');
      let config = JSON.parse(str);
      this.config = config;
      let info = config.serverInfo;
      let hasConfigActivities = [];
      let savedData = Object.entries(info).map(([key, ip]) => {
        let [name, activityId, showTime] = key.split('_');
        hasConfigActivities.push(activityId);
        return {
          name,
          activityId,
          ip,
          showTime,
        };
      });

      let allConfig = await readFile('config.json');
      allConfig = JSON.parse(allConfig);

      let configs = Object.values(allConfig).map(one => ({
        name: one.activityName,
        activityId: one.activityId,
        ip: '',
        showTime: one.showTime,
      }));

      let uniqueIds = [...new Set(configs.map(one => String(one.activityId)))];
      savedData = savedData.filter(one => uniqueIds.includes(one.activityId));

      let savedIds = savedData.map(one => one.activityId);
      let notSaveIds = uniqueIds.filter(one => !savedIds.includes(one));
      let notSaveData = [];
      for (let activityId of notSaveIds) {
        let target = configs.find(item => String(item.activityId) === activityId);
        notSaveData.push(target);
      }

      this.items = [...savedData, ...notSaveData];
    },
  },
};
</script>

<style lang="scss" scoped>
.show-ip {
  cursor: pointer;

  i {
    position: relative;
    top: 2px;
    margin-right: 10px;
  }
}

.server-info {
  margin-top: 15px;
  max-height: 60vh;
  overflow-y: auto;

  .row {
    display: flex;
    align-items: center;
    line-height: 2.5;

    .show {
      overflow: hidden;
      text-align: right;
      padding-right: 15px;
    }

    .val {
      width: 100px;
    }
  }
}
</style>
