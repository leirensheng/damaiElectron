<template>
  <div class="check-many">
    <div class="activity">
      <el-checkbox-group v-model="selected">
        <el-checkbox
          v-for="item in data"
          :key="item.activityId"
          style="margin: 5px"
          :label="item.curShowName + '_' + item.showTime + '_' + item.activityId"
          value="33"
          border
        />
      </el-checkbox-group>
      <div
        v-if="isRunning"
        class="mask"
      ></div>
    </div>
    <el-button
      v-if="!isRunning"
      type="success"
      @click="start"
    >
      启动
    </el-button>

    <el-button
      v-else
      type="danger"
      @click="start"
    >
      查看
    </el-button>

    <check-many-dialog
      v-model="dialogVisible"
      :ports="ports"
      :useful-numbers="usefulNumbers"
    ></check-many-dialog>
  </div>
</template>

<script>
import {readFile} from '#preload';
import CheckManyDialog from '/@/components/checkManyDialog.vue';
import {useStore} from '/@/store/global';

export default {
  components: {
    CheckManyDialog,
  },
  setup() {
    let store = useStore();
    let {pidInfo} = store;
    return {
      pidInfo,
    };
  },
  data() {
    return {
      dialogVisible: false,
      data: [],
      isRunning: false,
      selected: [],
    };
  },
  computed: {
    ports() {
      return this.selected
        .map(one => {
          let [, , activityId] = one.split('_');
          return this.data.find(one => one.activityId === activityId).port;
        })
        .sort((a, b) => a - b);
    },
  },
  watch: {
    dialogVisible(val) {
      if (!val) {
        this.init();
      }
    },
  },

  created() {
    this.init();
  },
  mounted() {},
  methods: {
    async init() {
      this.isRunning = false;
      this.selected = [];
      await this.getData();
      console.log('init');
      this.getUsefulNumbers();
    },
    start() {
      this.dialogVisible = true;
      this.isRunning = true;
    },
    async getUsefulNumbers() {

      this.getRunning();
    },
    getRunning() {
      let target = Object.keys(this.pidInfo).find(one => one.includes('checkMany'));
      if (target) {
        let regRes = target.match(/checkMany ([\d-]+) (\d+-\d+)/);
        let ports = regRes[1].split('-');
        console.log(ports);
        this.selected = this.data
          .filter(one => ports.includes(one.port))
          .map(item => item.curShowName + '_' + item.showTime + '_' + item.activityId);
        this.isRunning = true;
      }
    },
    async getData() {
      let str = await readFile('checkMap.json');
      let data = JSON.parse(str);
      data = Object.values(data);
      this.data = data;
    },
  },
};
</script>

<style scoped lang="scss">
.activity {
  position: relative;

  .mask {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    background: transparent;
    z-index: 5;
  }
}
</style>
