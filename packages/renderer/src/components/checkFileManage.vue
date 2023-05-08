<template>
  <div>
    <div class="wrap">
      <el-button
        v-if="['', 'config'].includes(mode)"
        :loading="loading"
        type="success"
        @click="cleanUser"
      >
        清理userData文件({{ userDataLength }})
      </el-button>

      <el-button
        v-if="loading"
        type="danger"
        @click="stop"
      >
        停止
      </el-button>
    </div>
    <div>
      <cmd-terminal
        v-if="loading"
        ref="terminal"
        :cmd-str="cmdStr"
        @done="reset"
      ></cmd-terminal>
    </div>
  </div>
</template>

<script>
import {useStore} from '/@/store/global';
import {ref} from 'vue';
import {getRunningCheck} from '/@/utils/index.js';
export default {
  components: {
  },
  setup() {
    let store = useStore();
    let {pidInfo} = store;
    // getRunningUser(pidInfo);
    let cmdStr = ref('');
    let terminal = ref(null);
    let loading = ref(false);
    let mode = ref('');
    let userDataLength = ref(0);



    let reset = () => {
      mode.value = '';
      loading.value = false;
    };
    let clean = () => {
      mode.value = 'check';
      let numbers = getRunningCheck(pidInfo);
      let ignoreStr = numbers.join(',');
      cmdStr.value = 'npm run cleanCheck ' + ignoreStr;
      loading.value = true;
    };
    let cleanUser = () => {
      mode.value = 'config';
      let cmds = Object.keys(pidInfo).filter(one => one.includes('npm run start'));
      console.log(cmds);
      let names = cmds.map(one => one.match(/npm run start (([^\s]+)($|\s))/)[2]);
      let ignoreStr = names.join(',');

      cmdStr.value = 'npm run cleanUser ' + ignoreStr;
      loading.value = true;
    };

    let stop = () => {
      terminal.value.close();
    };

    return {
      mode,
      userDataLength,
      reset,
      terminal,
      cleanUser,
      loading,
      cmdStr,
      clean,
      stop,
    };
  },
};
</script>

<style>
.wrap {
  margin: 10px;
  width: 50vw;
  display: flex;
  justify-content: center;
  align-items: center;
}
button {
  margin: 0 10px;
}
</style>
