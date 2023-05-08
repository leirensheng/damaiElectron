<template>
  <div class="check-config">
    <div class="items">
      <div
        v-for="item in allNumbers"
        :key="item"
        :class="getItemClass(item)"
        class="item"
        @click="selectOne(item)"
      >
        {{ item }}
      </div>
    </div>
    <el-form
      :disabled="running"
      :inline="true"
      class="form"
      label-width="100px"
    >
    </el-form>
    <el-button
      v-if="!running"
      :disabled="!isNumberOk"
      type="success"
      @click="confirm"
    >
      启动
    </el-button>

    <el-button
      class="reset"
      @click="reset"
    >
      重置
    </el-button>
  </div>
</template>

<script>
import {useStore} from '/@/store/global';

export default {
  components: {},
  props: {
    usefulNumbers: {
      type: Array,
      default: () => [],
    },
    ports: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['cmdChange'],
  setup() {
    let store = useStore();
    let {pidInfo} = store;
    return {
      pidInfo,
    };
  },
  data() {
    return {
      allNumbers: [],
      min: 0,
      max: 0,
      loading: false,
      startNum: 0,
      endNum: 0,
      isLoop: false,
      isOpen: false,
      isCheck: true,
      isUseNotDir: false,
      loopTicketType: '',
    };
  },
  computed: {
    isNumberOk() {
      return this.startNum && this.endNum >= this.startNum;
    },

    running() {
      return !!this.pidInfo[this.cmd];
    },
    cmd() {
      let str = `npm run checkMany ${this.ports.join('-')} ${this.startNum}-${this.endNum} `;

      return str;
    },
  },
  created() {
  },
  methods: {
    reset() {
      this.startNum = 0;
      this.endNum = 0;
    },
    getItemClass(item) {
      return {
        disabled: !this.usefulNumbers.includes(item),
        selected:
          [this.startNum, this.endNum].includes(item) ||
          (this.startNum < item && this.endNum > item),
      };
    },
    selectOne(one) {
      if (this.usefulNumbers.includes(one)) {
        if (!this.startNum) {
          if (this.checkMin(one)) {
            this.startNum = one;
          }
        } else {
          if (this.checkMax(one)) {
            this.endNum = one;
          }
        }
      }
    },
    checkMax(val) {
      if (val < this.startNum) return false;

      let cur = this.startNum + 1;
      while (cur <= val) {
        if (!this.usefulNumbers.includes(cur)) {
          return false;
        }
        cur += 1;
      }
      return true;
    },
    checkMin(val) {
      return this.usefulNumbers.includes(val + 1);
    },
    confirm() {
      this.$emit('cmdChange', this.cmd);
    },

  },
};
</script>

<style lang="scss" scoped>
.check-config {
  .reset {
    margin-left: 40%;
  }
}

.items {
  margin-bottom: 10px;

  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  .item {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 1px solid #409eff;

    // background: rgba(225, 228, 225, 0.1);
    &.disabled {
      background: #dcdfe6;
      border-color: #86888b;
      cursor: not-allowed;
    }

    &.selected {
      background: #409eff;
      color: white;
    }
  }
}
</style>
