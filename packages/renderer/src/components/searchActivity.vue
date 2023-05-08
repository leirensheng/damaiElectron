<template>
  <div>
    <div class="wrap">
      <el-input
        v-model="str"
        class="input"
        placeholder="演出"
        @keyup.enter="search"
      ></el-input>
      <el-button
        type="primary"
        @click="search"
      >
        查询
      </el-button>
      <el-switch v-model="isShow"></el-switch>
    </div>
    <div>
      <cmd-terminal
        ref="terminal"
        :cmd-str="cmdStr"
      ></cmd-terminal>
    </div>
  </div>
</template>

<script>
import {computed, ref} from 'vue';
export default {
  setup() {
    let str = ref('');
    let terminal = ref(null);
    let isShow = ref(false);

    let cmdStr = computed(() => {
      return str.value && 'node search.js ' + str.value + (isShow.value ? ' show' : '');
    });

    let search = () => {
      console.log(1111111, cmdStr.value);
      terminal.value.start();
    };

    return {
      isShow,
      terminal,
      cmdStr,
      search,
      str,
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
