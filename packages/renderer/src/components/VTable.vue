<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <div
    class="v-table"
    :class="isAutoHeight && 'auto-height'"
  >
    <div class="table">
      <el-table
        ref="table"
        :key="tableKey"
        v-loading="isLoading"
        :data="tableData"
        border
        fit
        size="medium"
        :row-class-name="tableRowClassName"
        :highlight-current-row="highlightCurrentRow"
        :height="isAutoHeight ? null : '100%'"
        :header-cell-style="handleTheadStyle"
        :default-sort="defaultSort"
        @sort-change="handleSortChange"
      >
        <el-table-column
          v-if="isShowIndex"
          type="index"
          label="i"
          width="60"
          align="center"
        />
        <el-table-column
          v-for="one in itemsHandled"
          :key="one.id"
          :prop="one.id"
          :label="one.name"
          :width="one.width"
          :min-width="one.minWidth"
          :align="one.align"
          :sortable="one.sortable"
          :show-overflow-tooltip="one.showOverflowTooltip"
          :header-align="one.headerAlign"
          :fixed="one.isFixedRight && 'right'"
        >
          <template #default="{row}">
            <el-link
              v-if="one.valueType === 'link' && one.linkHandler"
              type="primary"
              @click="one.linkHandler(row, row[one.id], one.id)"
            >
              {{ one.formatter(row[one.id]) }}
            </el-link>
            <el-link
              v-else-if="one.valueType === 'link'"
              type="primary"
              target="_blank"
              :href="row[one.id]"
            >
              {{ one.formatter(row[one.id]) }}
            </el-link>

            <div v-else-if="one.valueType === 'limitLength'">
              <el-popover
                v-if="row[one.id] && row[one.id].length > one.limitLength"
                placement="top-start"
                width="200"
                trigger="hover"
                :content="row[one.id]"
              >
                <template #reference>
                  <span>{{ one.formatter(row[one.id], one.limitLength) }}</span>
                </template>
              </el-popover>
              <span v-else>{{ row[one.id] }}</span>
            </div>
            <div v-else-if="one.valueType === 'const'">
              {{ one.constValue }}
            </div>
            <div v-else-if="one.valueType === 'slot'">
              <slot
                :row="row"
                :name="one.id"
              />
            </div>
            <div v-else-if="one.valueType === 'tag'">
              <el-tag>{{ one.formatter(row[one.id], row) }}</el-tag>
            </div>
            <div v-else-if="one.valueType === 'tags'">
              <template v-if="row[one.id]">
                <el-tag
                  v-for="item in row[one.id].split(',')"
                  :key="item"
                  style="margin: 2px"
                >
                  {{ one.formatter(item, row) }}
                </el-tag>
              </template>
            </div>
            <div v-else>{{ one.formatter(row[one.id], row) }}</div>
          </template>
        </el-table-column>

        <el-table-column
          v-if="hasPermissionBtns.length"
          label="操作"
          :width="btnsWidth"
          :align="'center'"
          :fixed="isFixedRight && 'right'"
        >
          <template #default="{row, $index}">
            <div
              class="table-btns"
              :style="tableBtnsStyle"
            >
              <template v-for="oneConfig in hasPermissionBtns">
                <slot
                  v-if="oneConfig.slot"
                  :name="oneConfig.slot"
                  :row-data="row"
                />
                <el-button
                  v-else-if="
                    typeof oneConfig.show === 'function'
                      ? oneConfig.show(row)
                      : oneConfig.show !== false
                  "
                  :key="oneConfig.name"
                  :type="oneConfig.type || 'default'"
                  size="small"
                  :loading="row.loading"
                  :disabled="
                    typeof oneConfig.disabled === 'function'
                      ? oneConfig.disabled(row)
                      : oneConfig.disabled
                  "
                  @click="() => handleTableBtnClick(oneConfig, row, $index)"
                >
                  {{ oneConfig.name }}
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div
      v-show="!isHidePagination"
      class="pagi"
    >
      <pagination
        v-model:current-page="params.currPage"
        v-model:page-size="params.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[5, 10, 20, 30, 50]"
        @change="getList(true)"
      >
      </pagination>
    </div>
  </div>
</template>
<script>
import Pagination from '/@/components/Pagination.vue';
import formatDate from '/@/utils/formattime';
import keepScrollPosition from '/@/utils/keepScrollPosition';

export default {
  name: 'VTable',
  components: {
    Pagination,
  },
  mixins: [keepScrollPosition],
  props: {
    tableRowClassName: {
      type: Function,
      default: () => {
        return '';
      },
    },
    // isNoDataShow: {
    //   default: true,
    //   type: Boolean
    // },
    highlightCurrentRow: {
      type: Boolean,
      default: () => true,
    },
    isAutoHeight: {
      type: Boolean,
      default: false,
    },
    isFixedRight: {
      type: Boolean,
      default: true,
    },
    isShowPageTips: {
      type: Boolean,
      default: false,
    },
    tableKey: {
      type: String,
      default: 'id',
    },
    tableBtnsAlign: {
      type: String,
      default: 'center',
    },
    defaultSort: {
      type: Object,
      default: () => ({}),
    },
    params: {
      type: Object,
      default: () => ({}),
    },
    isShowIndex: {
      type: Boolean,
      default: true,
    },
    // 表格里面的按钮控制
    tableBtnsConfig: {
      type: Array,
      default: () => [],
    },
    items: {
      type: Array,
      default: () => [],
    },
    api: {
      type: Function,
      default: null,
    },
    columnQueryFieldMap: {
      type: Object,
      default: () => ({}),
    },
    onePageHidePagination: {
      type: Boolean,
      default: () => false,
    },
  },
  data() {
    return {
      isNoDataShow: false,
      isLoading: false,
      scrollWrapSelector: '.el-table__body-wrapper',
      total: 0,
      tableData: [],
      orderList: [],
    };
  },
  computed: {
    isHidePagination() {
      return (
        this.onePageHidePagination &&
        this.params.currPage === 1 &&
        this.total <= this.tableData.length
      );
    },
    tableBtnsStyle() {
      return {
        'justify-content': this.tableBtnsAlign,
      };
    },
    hasPermissionBtns() {
      return this.tableBtnsConfig.filter(() => true);
    },
    btnsWidth() {
      const btnLength = this.hasPermissionBtns.length;
      if (btnLength === 0) return 0;
      const str = this.hasPermissionBtns.map(one => one.name).join('');
      let chiLength = str.split('').filter(one => one.match(/ [\u4e00-\u9fa5]/)).length;
      let engLength = str.length - chiLength;
      return 32 * btnLength + 12 * chiLength + engLength * 6 + 40 + (btnLength - 1) * 10;
    },
    itemsHandled() {
      return this.items.map(one => {
        const defaultObj = {
          formatter: this.noop,
          hederAlign: 'center',
          align: 'center',
        };
        let obj = {
          ...one,
        };
        if (one.valueType === 'limitLength') {
          obj.limitLength = obj.limitLength || 10;
          obj.formatter = one.formatter || this.getLimitStr;
        } else if (one.valueType === 'date') {
          obj.formatter = obj.formatter || this.formatDate;
        } else if (one.valueType === 'time') {
          obj.formatter = obj.formatter || this.formatTime;
        } else if (one.options && !one.formatter) {
          obj.formatter = this.getFormatterFromOptions(one);
        }
        obj = Object.assign(defaultObj, obj);

        if (this.isNoDataShow) {
          const newObj = {...obj};
          const oldFormater = obj.formatter;
          newObj.formatter = (...arg) => {
            const res = oldFormater(...arg);
            return !res && res !== 0 ? '-' : res;
          };
          return newObj;
        }
        return obj;
      });
    },
  },
  watch: {
    defaultSort: {
      immediate: true,
      handler(val) {
        if (Object.keys(val).length) {
          this.orderList = [{...val}];
          const column = this.columnQueryFieldMap[val.prop] || val.prop;
          // eslint-disable-next-line vue/no-mutating-props
          this.params.orderItems = [{column, asc: val.order !== 'descending'}];
        }
      },
    },
  },
  created() {
    this.isNoDataShow = window.location.href.indexOf('#/analyse') !== -1;
  },
  activated() {
    this.$nextTick(() => {
      this.$refs.table.doLayout(); // 解决表格错位
    });
  },
  methods: {
    getFormatterFromOptions(one) {
      return val => {
        const target = one.options.find(_ => {
          // eslint-disable-next-line no-restricted-globals
          if (!isNaN(Number(_.id))) {
            return Number(_.id) === Number(val);
          }
          return _.id === val;
        });
        return target ? target.name : val;
      };
    },
    noop(val) {
      return val;
    },
    formatDate(time) {
      if (time) {
        const date = new Date(time);
        return formatDate(date, 'yyyy-MM-dd');
      }
      return '';
    },
    formatTime(time) {
      if (time) {
        const date = new Date(time);
        return formatDate(date, 'yyyy-MM-dd hh:mm:ss');
      }
      return '';
    },
    handleTheadStyle({column}) {
      const orderItem = this.orderList.find(item => item.prop === column.property);
      // eslint-disable-next-line no-param-reassign
      if (orderItem) column.order = orderItem.order;
    },
    handleSortChange({prop, order}) {
      const orderItem = this.orderList.find(item => item.prop === prop);
      if (orderItem) {
        orderItem.order = order;
      } else {
        this.orderList.push({prop, order});
      }
      const {orderItems} = this.params;
      const queryProp = this.columnQueryFieldMap[prop] || prop;
      const orderItemIndex = orderItems.findIndex(one => one.column === queryProp);
      if (order != null) {
        if (orderItemIndex > -1) {
          orderItems[orderItemIndex] = {
            column: queryProp,
            asc: order === 'ascending',
          };
        } else {
          orderItems.push({column: queryProp, asc: order === 'ascending'});
        }
      } else if (orderItemIndex > -1) {
        orderItems.splice(orderItemIndex, 1);
      }
      this.getList();
    },
    handleTableBtnClick({handler, editConfig}, rowData, index) {
      if (handler) {
        handler(rowData, index);
      } else if (editConfig) {
        this.$emit('openEditDialog', {rowData, editConfig, index});
      }
    },
    async getList(isPageChange) {
      this.isLoading = true;
      const params = JSON.parse(JSON.stringify(this.params));
      this.$emit('beforeQuery', params);
      return this.api(params)
        .then(data => {
          this.$emit('beforeAssignToTable', data);
          this.isLoading = false;
          this.tableData = data.records;
          this.total = data.total;
          if (isPageChange) {
            const dom = this.$el.nextElementSibling.querySelector('thead');
            console.log(dom);
            setTimeout(() => {
              dom.scrollIntoView({behavior: 'smooth'});
            }, 100);
          }
          this.$emit('afterQuery', data.records);
        })
        .catch(() => {
          this.isLoading = false;
        });
    },
    getLimitStr(str, length) {
      if (str === undefined) {
        return '';
      }
      if (str.length <= length) {
        return str;
      }
      return `${str.slice(0, length)}...`;
    },
  },
};
</script>
<style lang="scss" scoped>
.v-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  .table {
    flex: 1;
    overflow: auto;
    .table-btns {
      display: flex;
      align-items: center;
      padding: 0 10px;
    }
  }
  .pagi {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    border: 1px solid #dfe6ec;
    border-top: none;
    .pagination-container {
      border: none;
    }
  }
  &.auto-height {
    height: auto !important;
    display: block;
  }
}
</style>
