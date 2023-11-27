<template>
  <div>
    <S-Table
      ref="table"
      :highlight-current-row="false"
      :is-auto-height="true"
      :items="items"
      :api="getData"
      :add-config="addConfig"
      one-page-hide-pagination
      :table-btns-config="tableBtnsConfig"
      :on-dialog-open="onDialogOpen"
      @afterQuery="removeExpired"
    >
      <template #onlyMonitorType="{ row }">
        <el-tag
          v-for="(item, i) in row.onlyMonitorType"
          :key="item"
          :type="types[i]"
          effect="dark"
          round
          style="margin: 4px"
        >
          {{ item }}
        </el-tag>
      </template>
    </S-Table>
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      width="80%"
      @close="handleClose"
    >
      <div
        v-if="dialogVisible"
        class="terminal-warp"
      >
        <cmd-terminal2
          :cmd="curRow.cmd"
          @exit="exit"
        ></cmd-terminal2>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { readFile, cmd, writeFile } from '#preload';
import { ElMessageBox } from 'element-plus';
import { useStore } from '/@/store/global';
import eventBus from '/@/utils/eventBus.js';
import { ElNotification } from 'element-plus';
import axios from 'axios';

export default {
  components: {

  },
  setup() {
    let store = useStore();
    let { pidInfo } = store;
    return {
      pidInfo,
    };
  },
  data() {
    return {
      curRow: {},
      dialogVisible: false,
      cmd: '',
      addConfig: {
        handler: this.handlerAdd,
      },
      types: ['', 'success', 'danger', 'warning'],
      tableBtnsConfig: [
        {
          type: 'success',
          handler: this.start,
          show: row => row.status === 0,
          name: '启动',
        },
        {
          type: 'danger',
          handler: this.start,
          show: row => row.status === 1,
          name: '查看',
        },
        {
          type: 'primary',
          editConfig: {
            handler: this.handleEdit,
          },
          name: '编辑',
        },
        {
          handler: this.remove,
          name: '删除',
          type: 'danger',
        },
      ],
    };
  },
  computed: {
    title() {
      let { activityName, port } = this.curRow || {};
      return `npm run check ${port}_${activityName}`;
    },

    items() {
      return [
        {
          id: 'port',
          name: '启动端口',
          width: 100,
          support: {
            query: {},
            add: {},
            edit: {},
          },
        },

        {
          id: 'activityId',
          name: 'activityId',
          width: 100,
          support: {
            add: {},
            edit: {},
          },
        },

        {
          id: 'activityName',
          name: '名称',
          minWidth: 200,
          support: {
            query: {},
          },
        },
        {
          id: 'waitForTime',
          name: '开抢时间',
          width: 110,

          options: [],
          support: {
            edit: {
              type: 'date',
              // type:'radio',
            },
            add: {
              type: 'date',

              // type:'radio',
            },
          },
        },
        {
          id: 'onlyMonitorType',
          name: '检测类型',
          width: 120,
          valueType: 'slot',
          options: [],
          support: {
            edit: {
              // type:'radio',
              type: 'multipleSelect',
            },
          },
        },
        {
          id: 'ticketTypes',
          name: '所有类型',
          isShow: false,
          //  valueType:'text',
          support: {
            edit: {
              type: 'text',
            },
          },
        },

      ];
    },
  },
  created() {
    eventBus.on('getCheckList', this.getList);
  },
  unmounted() {
    eventBus.off('getCheckList', this.getList);
  },

  methods: {
    exit() {
      this.dialogVisible = false;
      this.curRow.status = 0;
    },
    handleClose() {
      this.getList();
    },
    start(row) {
      this.curRow = row;
      this.dialogVisible = true;
    },
    runOne(port) {
      return new Promise((resolve, reject) => {
        let str = `npm run check ${port}`;
        let child = cmd(str, data => {
          if (data.includes('检查完成')) {
            child.close();
            resolve();
          }
        });
        setTimeout(() => {
          reject('timeout');
          child && child.close();
        }, 10000);
      });
    },
    async updateLoopType(loopTicketType) {
      let obj = { ...this.curRow, loopTicketType };
      await this.updateFile({ key: this.curRow.port, val: obj });
    },
    async handlerAdd(val) {
      let obj = { ...val };
      try {
        await this.updateFile({ key: val.port, val: obj, isAdd: true });
        await this.runOne(val.port);
        await this.$refs.table.getList();
      } catch (e) {
        console.log(e);
      }
    },
    async handleEdit(val) {
      let noSaveFields = ['ticketTypes', 'skuIdToTypeMap', 'status', 'cmd', 'color'];
      noSaveFields.forEach(one => {
        delete val[one];
      });
      await this.updateFile({
        key: this.oldPort,
        val: val,
      });
      if (val.port !== this.oldPort) {
        let fileData = await this.getCheckFile();
        if (fileData[val.port]) {
          throw new Error('已经有了' + val.port);
        } else {
          fileData[val.port] = fileData[this.oldPort];
          delete fileData[this.oldPort];
          await writeFile('checkMap.json', JSON.stringify(fileData, null, 4));
        }
      }
      await this.$refs.table.getList();
    },
    async updateFile({ key, val, isAdd }) {
      let fileData = await this.getCheckFile();
      if (isAdd && fileData[key] !== undefined) {
        throw new Error('已经有了' + key);
      }
      fileData[key] = val;
      await writeFile('checkMap.json', JSON.stringify(fileData, null, 4));
    },
    async onDialogOpen(form) {
      let target = this.items.find(one => one.id === 'onlyMonitorType');
      target.options = (form.ticketTypes || []).map(one => ({ id: one, name: one }));
      this.oldPort = form.port;
      return form;
    },
    async remove(obj) {
      await ElMessageBox.confirm(`确定删除【${obj.activityName}】?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      let fileData = await this.getCheckFile();
      delete fileData[obj.port];
      await writeFile('checkMap.json', JSON.stringify(fileData, null, 4));
      await this.$refs.table.getList();
    },
    getList() {
      this.$refs.table.getList();
    },
    async removeExpired(data) {
      let fileData = await this.getCheckFile();
      let hasExpiredArr = [];

      for (let one of data) {
        let dates = [... new Set(Object.values(one.skuIdToTypeMap).map(one => {
          let date = one.split('_')[0];
          let arr = date.split(/(\s+)/);
          return arr[0] + ' ' + arr.slice(-1)[0];
        }))];

        let isExpired = dates.every(date => new Date(date) < new Date());
        if (isExpired) {
          console.log(one.activityName + '过期');
          delete fileData[one.port];
          hasExpiredArr.push(one.activityName);
          let pid = this.pidInfo[`npm run check ${one.port}`];
          if (pid) {
            await axios.get('http://127.0.0.1:5000/close/' + pid);
          }
        }
      }
      if (hasExpiredArr.length) {
        await writeFile('checkMap.json', JSON.stringify(fileData, null, 4));
        await this.$refs.table.getList();
        ElNotification({
          title: '有过期的',
          message: hasExpiredArr.join('__'),
          type: 'success',
        });
      }
    },
    async getCheckFile() {
      let str = await readFile('checkMap.json');
      return JSON.parse(str);
    },


    async getData({ queryItems }) {
      let obj = await this.getCheckFile();
      let data = Object.values(obj);
      let items = queryItems.filter(item => item.value);
      data = data.filter(one => {
        return items.every(({ value, column }) => String(one[column]).indexOf(value) !== -1);
      });

      let cmds = Object.keys(this.pidInfo);
      data.forEach(one => {
        one.cmd = `npm run check ${one.port}`;
        one.status = cmds.some(cmd => cmd === one.cmd) ? 1 : 0;
        one.ticketTypes = Object.values(one.skuIdToTypeMap || []);
      });
      data.sort((a, b) => (a.activityName[1]).charCodeAt() - (b.activityName[1]).charCodeAt());
      return {
        total: data.length,
        records: data,
      };
    },
  },
};
</script>

<style></style>
