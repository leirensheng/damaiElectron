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
      recovering: false,
    };
  },
  computed: {
    isShowRecover() {
      let pidInfo = JSON.parse(localStorage.getItem('pidInfo') || '{}');
      let usernames = Object.keys(pidInfo)
        .filter(one => one.includes('npm run start'))
        .map(one => one.replace('npm run start ', ''));
      let cmds = this.tableData
        .filter(one => !one.status && usernames.includes(one.username))
        .map(one => one.cmd);
      return cmds.length !== 0;
    },
  },
  created() {},
  methods: {
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
        let {pid} = await startCmdWithPidInfo(cmd, successMsg);
        pidInfo[cmd] = pid;
      } catch (e) {
        delete pidInfo[cmd];
        this.failCmds.push(cmd);
        console.log(e);
      }
      this.setPidInfo(pidInfo);
    },

    async recover() {
      window.noSetLocalStorage = true;
      this.recovering = true;
      let pidInfo = JSON.parse(localStorage.getItem('pidInfo') || '{}');
      try {
        let cmds = Object.keys(pidInfo);

        let userCmds = cmds.filter(one => one.includes('npm run start'));
        let checkCmds = cmds.filter(one => one.includes('npm run check'));
        for (let cmd of userCmds) {
          await this.recoverOne(pidInfo, cmd, '信息获取完成');
        }
        for (let cmd of checkCmds) {
          await this.recoverOne(pidInfo, cmd, '开始进行');
        }

        window.noSetLocalStorage = false;
        this.setPidInfo({...pidInfo});
        this.$emit('getList');
      } catch (e) {
        window.noSetLocalStorage = false;
        ElNotification({
          title: '失败',
          message: e.message,
          type: 'error',
        });
      }

      this.recovering = false;
    },
  },
};
</script>

<style scoped lang="scss"></style>
