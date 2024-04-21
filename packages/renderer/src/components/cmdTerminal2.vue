<template>
  <div class="content-wrap">
    <pre>
    {{ showData }}
  </pre>
  </div>
  <div class="close-wrap">
    <el-button
      v-if="pidInfo[cmd]"
      type="danger"
      @click="close"
    >
      停止
    </el-button>
    <div v-else>已停止</div>
  </div>
</template>

<script>
import axios from 'axios';
import {useStore} from '/@/store/global';

export default {
  props: {
    cmd: {
      type: String,
      default: '',
    },
    noSavePidInfo: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['exit', 'message'],
  setup() {
    let store = useStore();
    let {pidInfo} = store;
    return {
      pidInfo,
    };
  },
  data() {
    return {
      showData: '',
    };
  },
  computed: {
    status() {
      return this.pidInfo[this.cmd] ? 'success' : 'danger';
    },
  },

  mounted() {
    this.init();
  },
  beforeUnmount() {
    this.socket && this.socket.close();
  },
  methods: {
    async close() {
      let pid = this.pidInfo[this.cmd];
      this.socket.close();
      await axios.get('http://127.0.0.1:5000/close/' + pid);
      window.noSavePidInfo = this.noSavePidInfo;
      setTimeout(() => {
        window.noSavePidInfo = false;
      }, 200);
      delete this.pidInfo[this.cmd];
      this.$emit('exit');
    },
    async init() {
      const socketURL = 'ws://127.0.0.1:5000/socket/';
      let prePid = this.pidInfo[this.cmd];
      let pid;
      console.log('命令:', this.cmd);

      if (!prePid) {
        let {data} = await axios
          .get('http://127.0.0.1:5000/terminal')
          .then(res => res.data)
          .catch(err => {
            console.log(111111, err);
            throw new Error(err);
          });
        console.log('新增进程:' + data);
        pid = data;
        window.noSavePidInfo = this.noSavePidInfo;
        setTimeout(() => {
          window.noSavePidInfo = false;
        }, 200);
        this.pidInfo[this.cmd] = pid;
      } else {
        pid = prePid;
        console.log('连接进程:', pid);
      }

      let ws = new WebSocket(socketURL + pid);
      ws.onopen = () => {
        if (!prePid) {
          ws.send(`${this.cmd} \r\n`);
        }
      };
      this.socket = ws;

      ws.onmessage = val => {
        this.showData = this.showData + val.data;
        console.log(val.data);
        this.$emit('message', val.data);
      };
    },
  },
};
</script>

<style scoped lang="scss">
.content-wrap{
  height: 60vh;
  overflow: auto;
}
#terminal {
  height: 100%;
}

.close-wrap {
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
