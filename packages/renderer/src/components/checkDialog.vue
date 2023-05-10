<template>
  <el-dialog
    v-bind="$attrs"
    width="80%"
    :title="title"
    @close="beforeClose"
  >
    <div
      v-if="$attrs.modelValue"
      class="terminal-warp"
    >
      <start-check-config
        v-if="!isRunning"
        ref="config"
        :port="port"
        :config="config"
        :useful-numbers="usefulNumbers"
        @update-loop-type="updateLoopType"
        @cmd-change="cmdChange"
      ></start-check-config>
      <cmd-terminal2
        v-if="isRunning || showTerminal"
        :cmd="runningCmd || cmd"
        @exit="exit"
      ></cmd-terminal2>
    </div>
  </el-dialog>
</template>

<script>
import CmdTerminal2 from './cmdTerminal2.vue';
import StartCheckConfig from './startCheckConfig.vue';
import {useStore} from '/@/store/global';

export default {
  components: {
    CmdTerminal2,
    StartCheckConfig,
  },

  props: {
    port: {
      type: String,
      default: '',
    },
    usefulNumbers: {
      type: Array,
      default: () => [],
    },
    config: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['exit', 'close', 'updateLoopType'],
  setup() {
    let store = useStore();
    let {pidInfo} = store;
    return {
      pidInfo,
    };
  },
  data() {
    return {
      cmd: '',
      showTerminal: false,
    };
  },
  computed: {
    title() {
      let {showTime, activityName} = this.config;
      return `${this.runningCmd || this.cmd}__${activityName}__${showTime}`;
    },
    isRunning() {
      return !!this.runningCmd;
    },
    runningCmd() {
      let cmds = Object.keys(this.pidInfo);
      return cmds.find(cmd => cmd.includes(`npm run check ${this.port} `));
    },
  },
  methods: {
    beforeClose() {
      this.showTerminal = false;
      this.$emit('close');
      this.cmd = '';
    },
    updateLoopType(val) {
      this.$emit('updateLoopType', val);
    },
    cmdChange(val) {
      this.cmd = val;
      this.showTerminal = true;
    },
    exit() {
      this.showTerminal = false;
      this.cmd = '';
      this.$emit('exit');
    },
  },
};
</script>

<style></style>
