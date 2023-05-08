<template>
  <div class="table-page-container">
    <div
      v-if="queryItems.length"
      class="filter-container"
    >
      <template v-for="one in queryItems">
        <el-input
          v-if="one.queryType === 'input'"
          :key="one.id"
          v-model="params[one.id]"
          :placeholder="one.placeholder"
          size="default"
          class="filter-item query-item"
          :style="{width: one.support.query.width + 'px'}"
          @keyup.enter="handleFilter"
          @input="
            val => {
              handleQueryChange(val, one.id, one);
            }
          "
        />

        <el-select
          v-else-if="['multipleSelect', 'select'].includes(one.queryType)"
          :key="one.id"
          v-model="params[one.id]"
          :multiple="one.queryType === 'multipleSelect'"
          clearable
          size="default"
          class="filter-item query-item"
          :placeholder="one.placeholder"
          filterable
          @keyup.enter="handleFilter"
          @change="
            val => {
              handleQueryChange(val, one.id, one);
            }
          "
        >
          <el-option
            v-for="option in one.options"
            :key="option.id"
            :value="option.id"
            :label="option.name"
          />
        </el-select>
        <el-date-picker
          v-else-if="one.queryType === 'date'"
          :key="one.id"
          v-model="params[one.id]"
          size="default"
          type="date"
          :placeholder="one.placeholder"
          class="filter-item query-item"
          format="YYYY 年 MM 月 DD 日"
          @change="
            val => {
              handleQueryChange(val, one.id, one);
            }
          "
        />

        <el-date-picker
          v-else-if="one.queryType === 'year'"
          :key="one.id"
          v-model="params[one.id]"
          size="default"
          type="year"
          :placeholder="one.placeholder"
          class="filter-item query-item"
          @change="
            val => {
              handleQueryChange(val, one.id, one);
            }
          "
        />
        <slot
          v-else-if="one.queryType === 'slot'"
          :name="one.slotName"
        />
      </template>
      <!-- <el-button
        class="filter-item"
        type="primary"
        size="default"
        @click="handleFilter"
      >
        查询
      </el-button> -->
      <el-button
        v-if="supportReset"
        class="filter-item"
        style="margin-left: 10px"
        type="default"
        size="default"
        @click="reset"
      >
        重置
      </el-button>
      <el-button
        v-if="supportAdd"
        class="filter-item"
        style="margin-left: 10px"
        type="default"
        size="default"
        @click="openAddDialog"
      >
        新增
      </el-button>

      <slot name="queryBtn" />
    </div>
    <div class="table-container">
      <v-table
        v-if="isTableReady"
        ref="table"
        v-bind="$attrs"
        :items="tableItems"
        :params="paramsForTable"
        :column-query-field-map="columnQueryFieldMap"
        :table-btns-config="tableBtnsConfig"
        @open-edit-dialog="openEditDialog"
      >
        <template
          v-for="one in btnSlotForTable"
          #[one.slot]
        >
          <slot :name="one.slot" />
        </template>

        <template
          v-for="one in itemSlotForTable"
          #[one.id]="{row}"
        >
          <slot
            :row="row"
            :name="one.id"
          />
        </template>
      </v-table>
    </div>
    <v-dialog
      ref="vDialog"
      :inputs="dataForDialog"
      :basic-edit-form="basicEditForm"
      :basic-add-form="basicAddForm"
      :dialog-width="dialogWidth"
      :on-dialog-open="onDialogOpen"
      v-bind="$attrs"
      @edit="form => save(form, 'edit')"
      @add="form => save(form, 'add')"
    />
  </div>
</template>

<script>
import VTable from '/@/components/VTable.vue';
import mitt from 'mitt';
import dayjs from 'dayjs';
import VDialog from './vDialog.vue';
import {ElNotification} from 'element-plus';
const emitter = mitt();

export default {
  name: 'STable',
  components: {
    // eslint-disable-next-line vue/no-unused-components
    VTable,
    VDialog,
  },
  props: {
    regionCascaderDataPrefix: {
      type: String,
      default: '',
    },
    items: {
      type: Array,
      default: () => [],
    },
    dialogWidth: {
      type: [String, Number],
      default: '40%',
    },
    supportReset: {
      type: Boolean,
      default: true,
    },
    searchImmediately: {
      type: Boolean,
      default: true,
    },
    columnQueryFieldMap: {
      type: Object,
      default: () => ({}),
    },
    addConfig: {
      type: Object,
      default: () => ({}),
    },
    basicQueryForm: {
      type: Object,
      default: () => ({}),
    },
    basicEditForm: {
      type: Object,
      default: () => ({}),
    },
    basicAddForm: {
      type: Object,
      default: () => ({}),
    },
    onDialogOpen: {
      type: Function,
      default: null,
    },
    tableBtnsConfig: {
      type: Array,
      default: () => [],
    },

    defaultPageSize: {
      type: Number,
      default: () => 20,
    },
  },
  data() {
    return {
      categoryCascaderValue: [],
      basicQuery: [], // 处理后的默认查询参数
      paramsForTable: {
        queryItems: [],
        currPage: 1,
        pageSize: 50,
        orderItems: [],
      },
      initCount: null, // 需要远程获取option的数量
      hasInitCount: 0, // 已经初始化option的数量
      queryItems: [],
      params: {}, // 扁平化的原始参数
      tableItems: [],
      queryConfigMap: {},
      dataForDialog: {
        show: false,
        mode: '', // 编辑或者新增，
        form: '', // 表单
        index: '', // 当前编辑行在表格的索引
        items: [], // 字段
        confirmBtnLoading: false,
        dialogWidth: '40%',
      },
    };
  },
  computed: {
    btnSlotForTable() {
      return this.tableBtnsConfig.filter(one => one.slot);
    },
    itemSlotForTable() {
      return this.items.filter(one => one.valueType === 'slot');
    },
    supportAdd() {
      return this.items.filter(one => one.support && one.support.add).length > 0;
    },
    isTableReady() {
      const isReady = this.initCount === this.hasInitCount;
      if (isReady) {
        emitter.emit('sourceReady');
      }
      return isReady;
    },
    getList() {
      return this.$refs.table.getList;
    },
    editConfig() {
      const target = this.tableBtnsConfig.find(one => one.editConfig);
      return target ? target.editConfig : {};
    },
    startDateId() {
      const target = this.queryItems.find(one => one.queryType === 'date' && one.isStart === true);
      return target && target.id;
    },
    endDateId() {
      const target = this.queryItems.find(one => one.queryType === 'date' && one.isEnd === true);
      return target && target.id;
    },
  },
  mounted() {
    this.initCount = this.items.filter(one => one.source).length;
    if (
      this.items.find(
        one => one.support && one.support.query && one.support.query.type === 'category',
      )
    ) {
      this.initCount += 1;
    }

    emitter.on('sourceReady', this.handleReady);
    if (this.initCount !== 0) {
      this.initSource();
    }
  },
  methods: {
    reset() {
      this.$emit('reset');
      this.resetQuery(false);
    },
    // 对于cascader会有exp传入
    getRealParams(id, value, exp) {
      const config = {
        column: id,
        exp: exp || (this.queryConfigMap[id] ? this.queryConfigMap[id].exp : 'eq'),
        value: value || '', // 保证不为null
      };
      const {queryItems} = this.paramsForTable;
      const index = queryItems.findIndex(one => one.column === id);
      if (index !== -1) {
        queryItems[index] = config;
      } else {
        queryItems.push(config);
      }
    },
    // 查询条件变化，没有点击搜索
    handleQueryChange(val, id, {queryType}) {
      let newVal = val;
      if (queryType === 'year' && val) {
        newVal = dayjs(val).format('YYYY');
      } else if (queryType === 'date' && val) {
        newVal = dayjs(val).format('YYYY-MM-DD');
      }
      this.getRealParams(id, newVal);
      this.$emit('queryChange', id, val, this.params);
      this.handleFilter();
    },

    checkStart(id, val, params, endId) {
      if (val > params[endId]) {
        // eslint-disable-next-line no-param-reassign
        params[id] = params[endId];
      }
    },
    checkEnd(id, val, params, beginId) {
      if (val < params[beginId]) {
        // eslint-disable-next-line no-param-reassign
        params[id] = params[beginId];
      }
    },

    initSource() {
      this.items.forEach(one => {
        if (one.source) {
          one
            .source()
            .then(data => {
              if (!one.formatter) {
                this.generateFormatter(one);
              }
              this.hasInitCount += 1;
              // eslint-disable-next-line no-param-reassign
              one.options = this.transformOptions(data, one);
            })
            .catch(e => {
              ElNotification({
                title: 'Error',
                message: `获取${one.name}选项失败!`,
                type: 'error',
              });
              console.log(e);
            });
        }
      });
    },
    transformOptions(arr, {sourceFormat}) {
      return arr.map(one => {
        const val = one[sourceFormat ? sourceFormat.id : 'id'];
        return {
          id: sourceFormat && sourceFormat.type === 'number' ? Number(val) : val,
          name: one[sourceFormat ? sourceFormat.name : 'name'],
        };
      });
    },

    getExp(config) {
      if (['category', 'select'].includes(config.queryType)) {
        return 'eq';
      }
      if (config.queryType === 'region') {
        return config.support.query.exp || 'eq';
      }
      return config.support.query.exp || 'like';
    },
    getQueryItemsAndTableItems() {
      const queryItems = [];
      const tableItems = [];
      this.items.forEach(one => {
        if (one.support && one.support.query) {
          const config = {
            ...one,
            placeholder: one.placeholder || one.name,
            queryType: one.support.query.type || one.queryType || 'input',
            id: this.columnQueryFieldMap[one.id] || one.id,
            isEnd: one.support.query.isEnd,
            isStart: one.support.query.isStart,
            slotName: one.support.query.slotName || one.slotName,
          };
          config.exp = this.getExp(config);
          queryItems.push(config);
          this.queryConfigMap[config.id] = config;
        }
        if (one.isShow !== false) {
          tableItems.push(one);
        }
      });
      this.tableItems = tableItems;
      this.queryItems = queryItems;
    },

    initBasicQuery() {
      const queryItems = [];
      Object.keys(this.basicQueryForm).forEach(key => {
        queryItems.push({
          column: key,
          exp: 'eq',
          value: this.basicQueryForm[key],
        });
      });
      this.basicQuery = queryItems;
      this.paramsForTable.queryItems = [...this.basicQuery];
      this.paramsForTable.pageSize = this.defaultPageSize;
    },
    handleReady() {
      emitter.off('sourceReady', this.handleReady);
      this.$nextTick(() => {
        this.getQueryItemsAndTableItems();
        this.initBasicQuery();
        this.$nextTick(() => {
          this.$emit('ready');
          if (this.searchImmediately) {
            this.getList();
          }
        });
      });
    },

    generateFormatter(column) {
      // eslint-disable-next-line no-param-reassign
      column.formatter = val => {
        const target = column.options.find(one => {
          // eslint-disable-next-line no-restricted-globals
          if (!isNaN(Number(one.id))) {
            return Number(one.id) === Number(val);
          }
          return one.id === val;
        });
        return target ? target.name : val;
      };
    },

    handleFilter() {
      this.paramsForTable.currPage = 1;
      this.$nextTick(() => {
        this.getList();
      });
    },
    resetQuery(noSearch) {
      Object.keys(this.params).forEach(key => {
        this.params[key] = '';
      });
      this.paramsForTable.currPage = 1;
      this.paramsForTable.pageSize = 20;
      this.paramsForTable.queryItems = [...this.basicQuery];
      this.$emit('reset');
      if (!noSearch) {
        this.$nextTick(() => {
          this.getList();
        });
      }
    },

    setQueryParams(key, val) {
      this.params[key] = val;
      this.getRealParams(key, val);
    },
    setManyQueryParams(arr) {
      arr.forEach(one => {
        this.setQueryParams(one.key, one.value);
      });
    },

    addOrEdit(title, rowData, index) {
      let mode = 'add';
      this.dataForDialog.dialogWidth = this.dialogWidth;
      if (rowData) {
        mode = 'edit';
        this.dataForDialog.index = index;
        this.dataForDialog.form = rowData;
      }
      this.$nextTick(() => {
        this.dataForDialog.mode = mode;
        this.dataForDialog.items = this.items.filter(one => one.support && one.support[mode]);
        this.dataForDialog.title = title;
        this.dataForDialog.show = true;
      });
    },
    openEditDialog({rowData, editConfig, index}) {
      this.addOrEdit(editConfig.title, rowData, index);
    },
    openAddDialog() {
      this.addOrEdit(this.addConfig.title);
    },
    save(form, mode) {
      const config = this[`${mode}Config`];
      if (config && config.handler) {
        config
          .handler(form)
          .then(() => {
            this.dataForDialog.show = false;
            this.getList();
            ElNotification({
              title: '成功',
              message: config.successTips || '保存成功',
              type: 'success',
            });
          })
          .catch(e => {
            if (e) {
              ElNotification({
                title: 'Error',
                message: e.message,
                type: 'error',
              });
            }
          })
          .finally(() => {
            this.dataForDialog.confirmBtnLoading = false;
          });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.table-page-container {
  padding: 20px;

  height: calc(100% - 30px);
  display: flex;
  flex-direction: column;

  .filter-item {
    margin-bottom: 10px;
  }
  .filter-container {
    flex: 0 0 auto;
  }
  .table-container {
    flex: 1 1;
    overflow: auto;
  }
}
.query-item {
  width: 200px;
  margin-right: 5px;
}
</style>
<style lang="scss">
.filter-container {
  .el-date-editor.el-input,
  .el-date-editor.el-input__inner {
    width: 200px;
    margin-right: 5px;
  }
}
</style>
