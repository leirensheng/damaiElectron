<template>
  <div id="terminal"></div>
</template>

<script>
import {Terminal} from 'xterm';
import 'xterm/css/xterm.css';
import {FitAddon} from 'xterm-addon-fit';
import {cmd} from '#preload';

export default {
  props: {
    cmdStr: {
      type: String,
      default: '',
    },
    successStr: {
      type: String,
      default: '完成',
    },
  },
  emits: ['done'],
  data() {
    return {};
  },

  mounted() {
    var term = new Terminal({
      convertEol: true,
      cursorBlink: true,
      onSelectionChange: val => {
        console.log(val);
      },
    });
    term.onSelectionChange(() => {
      let content = term.getSelection();
      navigator.clipboard.writeText(content);
    });
    this.term = term;

    term.open(document.getElementById('terminal'));
    var fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddon.fit();
    window.onresize = () => {
      fitAddon.fit();
    };

    this.start();
  },
  methods: {
    start() {
      this.close();
      this.term.reset();
      if (!this.cmdStr) return;

      let val = 'cd ../damai &&' + this.cmdStr;
      console.log(val);
      this.child = cmd(val, data => {
        this.term.write('\r\n' + data.replace('\n', '\r\n').trim());
        if (data === 'done') {
          this.$emit('done');
        }
      });
    },
    close() {
      this.child && this.child.close();
    },
  },
};
</script>

<style scoped lang="scss">
#terminal {
  height: 100%;
  width: 100%;
}
</style>
