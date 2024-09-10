<template>
  <el-button
    v-if="isShowRecover"
    :loading="recovering"
    @click="recover"
  >
    恢复
  </el-button>

  <el-button
    v-if="failCmds.length"
    type="danger"
    @click="openDialog"
  >
    恢复失败！
  </el-button>
</template>

<script>
import {startCmdWithPidInfo} from '/@/utils/index.js';
import {ElNotification} from 'element-plus';
import {useStore} from '/@/store/global';
import {ElMessageBox} from 'element-plus';
import {storeToRefs} from 'pinia';
import {readFile} from '#preload';
import {getPidInfoFromFile} from '#preload';
import eventBus from '/@/utils/eventBus.js';
import axios from 'axios';

export default {
  props: {
    tableData: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['getList'],
  setup() {
    let store = useStore();
    let {setPidInfo, setFailCmds} = store;
    let {failCmds} = storeToRefs(store);

    return {
      setPidInfo,
      setFailCmds,
      failCmds,
    };
  },
  data() {
    return {
      isShowRecover: false,
      recovering: false,
    };
  },
  computed: {},
  watch: {
    tableData: {
      deep: true,
      handler() {
        this.checkIsShowRecover();
      },
    },
  },
  unmounted() {
    eventBus.off('recover', this.recover);
  },
  created() {
    eventBus.on('recover', this.recover);
    this.getIsSlave();
  },
  methods: {
    async getIsSlave() {
      let str = await readFile('localConfig.json');
      let {isSlave} = JSON.parse(str);
      this.isSlave = isSlave;
    },
    async checkIsShowRecover() {
      let pidInfo = await getPidInfoFromFile();
      let usernames = Object.keys(pidInfo)
        .filter(one => one.includes('npm run start'))
        .map(one => one.replace('npm run start ', ''));

      let cmds = this.tableData
        .filter(one => !one.status && usernames.includes(one.username))
        .map(one => one.cmd);
      this.isShowRecover = cmds.length !== 0;
      this.isShowRecover = true;
    },
    async openDialog() {
      let msg = this.failCmds.join('__');
      await ElMessageBox.confirm(`恢复失败: ${msg}`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      this.setFailCmds([]);
    },
    async recoverOne(pidInfo, cmd, successMsg) {
      try {
        let {pid} = await startCmdWithPidInfo({cmd, successMsg, isStopWhenLogin: true});
        pidInfo[cmd] = pid;
      } catch (e) {
        delete pidInfo[cmd];
        delete pidInfo[cmd + ' 1 true'];
        this.failCmds.push(cmd);
        console.log(e);
      }
      this.setPidInfo(pidInfo);
    },

    async recoverUser(userCmds, pidInfo) {
      for (let cmd of userCmds) {
        await this.recoverOne(pidInfo, cmd, '信息获取完成');
      }
    },
    async recoverCheck(checkCmds, pidInfo) {
      for (let cmd of checkCmds) {
        await this.recoverOne(pidInfo, cmd, '开始进行');
      }
    },
    async recover() {
      window.noSavePidInfo = true;
      this.recovering = true;
      let pidInfo = await getPidInfoFromFile();
      try {
        let cmds = Object.keys(pidInfo);

        let userCmds = cmds.filter(one => one.includes('npm run start'));
        let checkCmds = cmds.filter(one => one.includes('npm run check'));
        // userCmds =userCmds.map(cmd=> cmd.replace(/ 1 true/, ''));
        userCmds = [...new Set(userCmds)];

        await Promise.all([
          this.recoverCheck(checkCmds, pidInfo),
          this.recoverUser(userCmds, pidInfo),
        ]);

        if (this.isSlave) {
          axios({
            method: 'post',
            url: 'http://mticket.ddns.net:5000/saveSlavePid',
            data: {
              cmds:userCmds,
              pidInfo,
            },
          });
        }

        window.noSavePidInfo = false;
        this.setPidInfo({...pidInfo});
        this.$emit('getList');
      } catch (e) {
        window.noSavePidInfo = false;
        ElNotification({
          title: '失败',
          message: e.message,
          type: 'error',
        });
      }
      eventBus.emit('recoverDone', this.failCmds);
      this.recovering = false;
    },
  },
};
</script>

<style scoped lang="scss"></style>
