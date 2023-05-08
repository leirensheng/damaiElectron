<template>
  <!-- eslint-disable vue/no-mutating-props  -->
  <div>
    <el-dialog
      v-model="inputs.show"
      :append-to-body="isAppendToBody"
      :title="inputs.title"
      :close-on-click-modal="false"
      :before-close="beforeClose"
      :width="inputs.dialogWidth"
      @close="close"
      @open="open"
    >
      <div
        v-if="loading"
        v-loading="loading"
        class="loading"
      />
      <el-form
        v-if="inputs.show && !loading"
        ref="form"
        :model="form"
        :size="formSize"
        :validate-on-rule-change="false"
        :label-width="labelWidth + 'px'"
        :rules="formRules"
      >
        <div
          v-for="(one, index) in showItems"
          :key="index"
        >
          <el-form-item
            v-if="!['slot', 'title', 'underline'].includes(getItemType(one))"
            :prop="one.id"
            :label="getLabel(one)"
          >
            <!-- 文本 -->
            <span
              v-if="getItemType(one) == 'text'"
              style="color: green"
            >
              {{ form[one.id] }}
            </span>
            <!--select-->
            <el-select
              v-else-if="getItemType(one) == 'select'"
              v-model="form[one.id]"
              :placeholder="one.tips"
              clearable
              style="width: 100%"
              :disabled="isItemDisabled(one.support)"
              @change="val => handleItemChange(one)"
            >
              <!-- todo: change -->
              <el-option
                v-for="(option, index1) in one.options.filter(one => !one.noShow)"
                :key="index1"
                :label="one.sourceFormat ? option[one.sourceFormat.label] : option.name"
                :value="one.sourceFormat ? option[one.sourceFormat.value] : option.id"
              />
            </el-select>

            <el-radio-group
              v-else-if="getItemType(one) == 'radio'"
              v-model="form[one.id]"
              :disabled="isItemDisabled(one.support)"
              @change="val => handleItemChange(one)"
            >
              <el-radio
                v-for="(option, index1) in one.options.filter(one => !one.noShow)"
                :key="index1"
                :label="one.sourceFormat ? option[one.sourceFormat.value] : option.id"
              >
                {{ one.sourceFormat ? option[one.sourceFormat.label] : option.name }}
              </el-radio>
            </el-radio-group>

            <el-switch
              v-else-if="getItemType(one) == 'switch'"
              v-model="form[one.id]"
              active-color="#13ce66"
              inactive-color="rgb(175,175,175)"
            />
            <!-- 下拉多选 -->
            <el-select
              v-else-if="getItemType(one) == 'multipleSelect'"
              v-model="form[one.id]"
              clearable
              :placeholder="one.tips"
              multiple
              style="width: 100%"
              filterable
              :disabled="isItemDisabled(one.support)"
              @change="val => handleItemChange(one)"
            >
              <el-option
                v-for="(option, index2) in one.options.filter(one => !one.noShow)"
                :key="index2"
                :label="one.sourceFormat ? option[one.sourceFormat.label] : option.name"
                :value="one.sourceFormat ? option[one.sourceFormat.value] : option.id"
              />
            </el-select>
            <!-- textarea -->
            <el-input
              v-else-if="getItemType(one) == 'textarea'"
              v-model="form[one.id]"
              type="textarea"
              style="width: 100%"
              :placeholder="one.tips"
              :disabled="isItemDisabled(one.support)"
              :autosize="{minRows: 2, maxRows: 4}"
              @change="val => handleItemChange(one)"
            />
            <el-input
              v-else-if="getItemType(one) == 'password'"
              v-model="form[one.id]"
              show-password
              style="width: 100%"
              :placeholder="one.tips"
              :disabled="isItemDisabled(one.support)"
              @change="val => handleItemChange(one)"
            />

            <el-input-number
              v-else-if="getItemType(one) == 'number'"
              v-model="form[one.id]"
              :min="0"
              :label="one.tips"
              @contextmenu.prevent="rightClick(form, one.id)"
              @change="val => handleItemChange(one)"
            />

            <el-date-picker
              v-else-if="getItemType(one) == 'dateRange'"
              v-model="form[one.id]"
              type="datetimerange"
              :picker-options="pickerOptions"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              align="right"
              @change="val => handleItemChange(one)"
            />
            <el-date-picker
              v-else-if="getItemType(one) == 'date'"
              v-model="form[one.id]"
              size="small"
              type="datetime"
              style="width: 100%"
              :placeholder="one.tips"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="val => handleItemChange(one)"
            />

            <!-- RegionCascader -->
            <el-input
              v-else-if="getItemType(one) === 'input'"
              v-model="form[one.id]"
              :placeholder="one.tips"
              style="width: 100%"
              :disabled="isItemDisabled(one.support)"
              @contextmenu.prevent="rightClick(form, one.id)"
              @change="val => handleItemChange(one)"
            />
          </el-form-item>
          <div
            v-else-if="getItemType(one) == 'title'"
            class="title"
          >
            <span class="line" />
            {{ one.name }}
          </div>
          <div
            v-else-if="getItemType(one) == 'underline'"
            class="underline"
          />
          <slot
            v-else
            :form="form"
            :name="one.slotName"
          />
        </div>
        <el-form-item v-if="showBtns">
          <div style="float: right">
            <el-button
              size="default"
              @click="beforeClose"
            >
              取 消
            </el-button>
            <el-button
              :loading="inputs.confirmBtnLoading"
              size="default"
              type="primary"
              @click="confirm"
            >
              确 定
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>
import {readClip} from '#preload';

export default {
  components: {},
  props: {
    isAppendToBody: {
      type: Boolean,
      default: () => false,
    },
    inputs: {
      type: Object,
      required: true,
    },
    showBtns: {
      type: Boolean,
      default: () => true,
    },
    formSize: {
      type: String,
      default: () => 'default',
    },
    // 修改的时候不传给后端的字段
    notSendColumns: {
      type: Array,
      default: () => ['updateUser', 'updateTime', 'password', 'updatePassword', 'createTime'],
    },
    basicAddForm: {
      type: Object,
      default: () => {},
    },
    basicEditForm: {
      type: Object,
      default: () => {},
    },
    // 处理v-table 打开本弹窗时表单数据（异步的，同步的可以直接在vTable中的beforeAssignToDialog中处理）
    onDialogOpen: {
      type: Function,
      default: null,
    },
  },
  emits: ['dialogClose'],
  data() {
    return {
      formRules: {},
      form: {},
      loading: true,
      pickerOptions: {
        shortcuts: [
          {
            text: '最近一周',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', [start, end]);
            },
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit('pick', [start, end]);
            },
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit('pick', [start, end]);
            },
          },
        ],
      },
    };
  },
  computed: {
    showItems() {
      return this.inputs.items.filter(one => {
        if (one.isShowInDialog) {
          return typeof one.isShowInDialog === 'function'
            ? one.isShowInDialog(this.form)
            : [undefined, true].includes(one.isShowInDialog);
        }
        if (Array.isArray(one.support)) {
          return true;
        }
        if (typeof one.support === 'object') {
          const isShow = one.support[this.inputs.mode].show;
          return typeof isShow === 'function'
            ? isShow(this.form)
            : [undefined, true].includes(isShow);
        }
        return true;
      });
    },
    labelWidth() {
      const length = Math.max(...this.showItems.map(one => this.getNameLength(one.name)));
      return length * 17 + 24;
    },
  },
  methods: {
    rightClick(form, id) {
      form[id] = readClip();
    },
    beforeClose() {
      // eslint-disable-next-line vue/no-mutating-props
      this.inputs.show = false;
    },
    getNameLength(name) {
      let length = 0;
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < name.length; i++) {
        const isChinese = /[\u4e00-\u9fa5]|(（)|(）)/.test(name[i]);
        length += isChinese ? 1 : 0.75;
      }
      return length;
    },
    close() {
      this.form = {};
      // this.$refs.form.resetFields();
      this.formRules = {};
      this.$emit('dialogClose');
    },
    getItemType(config) {
      return (
        (config.support[this.inputs.mode] && config.support[this.inputs.mode].type) ||
        config.queryType ||
        'input'
      );
    },
    getLabel(config) {
      const label =
        (config.support[this.inputs.mode] && config.support[this.inputs.mode].dialogName) ||
        config.name;
      return label + (config.queryType === 'title' ? '' : '：');
    },
    isItemDisabled(support) {
      // support为数组时是基础配置，不支持设置disabled
      if (Array.isArray(support)) {
        return false;
      }
      if (typeof support[this.inputs.mode].disabled === 'function') {
        return support[this.inputs.mode].disabled(this.form);
      }
      return support[this.inputs.mode].disabled;
    },

    handleItemChange(config) {
      // 只有support为对象的时候才支持事件抛出
      if (config.support[this.inputs.mode] && config.support[this.inputs.mode].eventName) {
        this.$emit(config.support[this.inputs.mode].eventName, {
          value: this.form[config.id],
          id: config.id,
          form: this.form,
          curConfig: config,
          allConfig: this.inputs.items,
        });
      }
    },
    open() {
      this.initRule();
      if (this.inputs.mode === 'edit') {
        this.initForEdit();
      } else {
        this.initForAdd();
      }
    },
    initForAdd() {
      this.loading = false;
      this.inputs.items.forEach(one => {
        const value =
          one.support.add.defaultValue !== undefined ? one.support.add.defaultValue : '';
        this.form[one.id] = value;
      });
      if (this.basicAddForm) {
        this.form = {...this.form, ...this.basicAddForm};
      }
    },
    initForEdit() {
      const data = this.inputs.form && JSON.parse(JSON.stringify(this.inputs.form));
      if (this.onDialogOpen) {
        this.loading = true;
        this.onDialogOpen(data)
          .then(res => {
            this.initEditForm(res);
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        this.loading = false;
        this.initEditForm(data);
      }
    },
    initEditForm(form) {
      this.form = form;
      this.notSendColumns.forEach(one => {
        if (!this.showItems.map(column => column.id).includes(one)) {
          delete this.form[one];
        }
      });
      if (this.basicEditForm) {
        this.form = {...this.form, ...this.basicEditForm};
      }
    },
    // 初始化表单规则
    initRule() {
      this.inputs.items.forEach(one => {
        if (one.getValidator) {
          this.formRules[one.id].push({
            validator: one.getValidator(this),
            trigger: 'blur',
          });
        } else if (one.rules) {
          this.formRules[one.id] = one.rules;
        } else if (one.required) {
          const type = this.getItemType(one);
          const handleName = ['region', 'multipleRegion', 'select'].includes(type)
            ? '选择'
            : '输入';
          one.tips = one.tips || `请${handleName}${one.name}`;
          this.formRules[one.id] = [{required: true, trigger: 'blur', message: one.tips}];
        }
      });
    },
    confirm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const {mode} = this.inputs;
          // eslint-disable-next-line vue/no-mutating-props
          this.inputs.confirmBtnLoading = true;
          this.$emit(mode, {...this.form}, mode === 'edit' ? '修改' : '新增');
        }
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.loading {
  height: 30vh;
}
.title {
  padding: 7px;
  color: #0d0d0d;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 15px;
  .line {
    border: 3px solid #2e82ff;
    margin-right: 13px;
    border-radius: 4px;
  }
}
.underline {
  // width: 100
  margin-bottom: 16px;
  border-bottom: 1px dotted #d6d6d6;
}
</style>
