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
      <start-check-many-config
        v-if="!isRunning"
        ref="config"
        :ports="ports"
        :useful-numbers="usefulNumbers"
        @cmd-change="cmdChange"
      ></start-check-many-config>

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
import StartCheckManyConfig from './startCheckManyConfig.vue';
import {useStore} from '/@/store/global';

export default {
  components: {
    CmdTerminal2,
    StartCheckManyConfig,
  },

  props: {
    ports: {
      type: Array,
      default: () => [],
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
  emits: ['exit', 'close'],
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
      return '';
    },
    isRunning() {
      return !!this.runningCmd;
    },
    runningCmd() {
      let cmds = Object.keys(this.pidInfo);
      console.log(cmds, `npm run checkMany ${this.ports.join('-')}`);

      return cmds.find(cmd => cmd.includes(`npm run checkMany ${this.ports.join('-')}`));
    },
  },
  methods: {
    beforeClose() {
      this.showTerminal = false;
      this.$emit('close');
      this.cmd = '';
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
