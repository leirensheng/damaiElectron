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
      <el-form-item
        class="item"
        label="打开浏览器"
      >
        <el-switch v-model="isOpen" />
      </el-form-item>
      <!-- <el-form-item
        class="item"
        label="notData目录"
      >
        <el-switch
          v-model="isUseNotDir"
          @change="getDirNumber"
        />
      </el-form-item> -->
      <el-form-item
        v-if="!isOpen"
        class="item"
        label="自动点击"
      >
        <el-switch v-model="isLoop" />
      </el-form-item>
      <el-form-item
        v-if="!isOpen && isLoop"
        class="item"
        label="监测"
      >
        <el-switch v-model="isCheck" />
      </el-form-item>
      <el-form-item
        v-if="!isOpen && isLoop"
        class="item"
        label="循环点击"
      >
        <el-select v-model="loopTicketType">
          <el-option
            v-for="item in options"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
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
    port: {
      type: String,
      default: '',
    },
    config: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['cmdChange', 'updateLoopType'],
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
    options() {
      return this.config.ticketTypes.map(name => ({
        name,
        id: name,
      }));
    },
    running() {
      return !!this.pidInfo[this.cmd];
    },
    cmd() {
      let str = `npm run check ${this.port} ${this.startNum}-${this.endNum} `;
      let name = '';
      if (this.isCheck && this.isLoop) {
        name = 'loopAndCheck';
      }
      if (!this.isCheck && this.isLoop) {
        name = 'loop';
      }
      if (this.isCheck && !this.isLoop) {
        name = 'check';
      }
      let dir = this.isUseNotDir ? 'useNotDir' : 'useDataDir';
      str = this.isOpen ? `${str} show ${dir}` : `${str} ${name} ${dir} `;
      if (!this.isOpen && this.isLoop) {
        str += ` ${this.loopTicketType}`;
      }
      return str;
    },
  },
  created() {
    this.loopTicketType = this.config.loopTicketType || (this.options.length && this.options[0].id);
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
      if (this.config.loopTicketType !== this.loopTicketType) {
        this.$emit('updateLoopType', this.loopTicketType);
      }
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
