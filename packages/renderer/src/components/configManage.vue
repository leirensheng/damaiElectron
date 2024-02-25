<template>
  <div class="config-manage">
    <el-icon
      class="to-top"
      @click="toTop"
    >
      <Top />
    </el-icon>
    <div class="top">
      <el-form
        class="right"
        :inline="true"
      >
        <el-form-item>
          <el-button @click="stopServer">关闭服务器</el-button>
          <el-button @click="startServer">启动服务器</el-button>
          <calc-user></calc-user>
          <recover-state
            :table-data="tableData"
            @get-list="getList"
          ></recover-state>
        </el-form-item>

        <el-form-item label="隐藏频繁">
          <el-switch v-model="isHideFre"></el-switch>
        </el-form-item>
        <el-form-item label="show">
          <el-switch v-model="isShow"></el-switch>
        </el-form-item>
        <el-form-item label="去重">
          <el-switch v-model="isUnique"></el-switch>
        </el-form-item>
      </el-form>
    </div>

    <S-Table
      ref="table"
      v-loading="loading"
      :table-row-class-name="tableRowClassName"
      :highlight-current-row="false"
      :is-auto-height="true"
      :items="items"
      :api="getData"
      :add-config="addConfig"
      one-page-hide-pagination
      :table-btns-config="tableBtnsConfig"
      :on-dialog-open="onDialogOpen"
      @before-assign-to-table="beforeAssignToTable"
    >
      <template #username="{ row }">
        <div>
          <el-dropdown trigger="contextmenu">
            <span class="el-dropdown-link">
              <template v-if="!row.hasSuccess">
                <span v-if="row.uid">{{ row.username }}</span>
                <el-tag
                  v-if="!row.uid"
                  type="danger"
                  effect="dark"
                >
                  {{ row.username }}
                </el-tag>
              </template>
              <el-tag
                v-else
                type="success"
                effect="dark"
              >
                {{ row.username }}-ok
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="toOrder(row)">订单</el-dropdown-item>

                <el-dropdown-item
                  v-if="!row.status && !row.hasSuccess"
                  @click="copyToRemote(row)"
                >
                  复制配置到其他电脑
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="!row.status"
                  @click="remove(row)"
                >
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
      <template #activityId="{ row }">
        <div>
          <el-icon
            class="copy-icon"
            @click="copyText(row.activityId)"
          >
            <DocumentCopy />
          </el-icon>
          <span>{{ row.activityId }}</span>
        </div>
      </template>
      <template #activityName="{ row }">
        <div>
          <el-icon
            class="copy-icon"
            @click="copy(row)"
          >
            <DocumentCopy />
          </el-icon>
          <span>{{ row.activityName }}</span>
        </div>
      </template>
      <template #targetTypes="{ row }">
        <el-tag
          v-for="(item, i) in row.targetTypes"
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
          :cmd="cmd"
          @exit="exit"
        ></cmd-terminal2>
      </div>
    </el-dialog>

    <el-dialog
      v-model="remoteDialogVisible"
      width="80%"
    >
      <el-radio-group
        v-model="remotePc"
        size="large"
      >
        <el-radio-button
          v-for="one in pcs"
          :key="one"
          :disabled="one === pcName"
          :label="one"
        />
      </el-radio-group>

      <el-button
        :loading="sending"
        type="success"
        @click="send"
      >
        发送
      </el-button>
    </el-dialog>
  </div>
</template>

<script>
import { readFile, readDir, cmd, copyText, writeFile, getComputerName, getRemoteIp } from '#preload';
import { ElMessageBox } from 'element-plus';
import { useStore } from '/@/store/global';
import CmdTerminal2 from './cmdTerminal2.vue';
import axios from 'axios';
import { ElNotification } from 'element-plus';
import { getIp } from '/@/utils/index.js';
import { storeToRefs } from 'pinia';
import CalcUser from '/@/components/calcUser.vue';
import RecoverState from '/@/components/recoverState.vue';
import eventBus from '/@/utils/eventBus.js';
export default {
  components: {
    CmdTerminal2,
    CalcUser,
    RecoverState,
  },
  setup() {
    let store = useStore();
    let { pidInfo } = storeToRefs(store);

    let useServer = () => {
      let startServer = () => {
        cmd('cd ../slideServer && pm2 start slideServer.js && cd ../damaiServer && pm2 start damai.js', res => {
          if (res.includes('done')) {
            ElNotification({
              title: '成功',
              message: '启动成功',
              type: 'success',
            });
          }
        });
      };

      let stopServer = () => {
        cmd('cd ../slideServer && pm2 stop slideServer.js && cd ../damaiServer && pm2 stop damai.js');
      };
      return {
        startServer,
        stopServer,
      };
    };

    return {
      ...useServer(),
      pidInfo,
    };
  },
  data() {
    return {
      isUnique: false,
      tableData: [],
      pcName: '',
      pcs: ['新电脑', '虚拟机4.3', '虚拟机4.4', '惠普'],
      remoteDialogVisible: false,
      sending: false,
      remotePc: '新电脑',
      isHideFre: true,
      isShow: false,
      loading: false,
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
          show: row => row.status !== 1,
          editConfig: {
            handler: this.handleEdit,
          },
          name: '编辑',
        },
      ],
      items: [
        {
          id: 'hasSuccess',
          name: 'isSuccess',
          isShow: false,
          options: [
            { name: '是', id: true },
            { name: '否', id: false },
          ],
          support: {
            query: {
              type: 'select',
            },
          },
        },
        {
          id: 'username',
          name: 'user',
          width: 100,
          valueType: 'slot',
          rules: [{ validator: this.validateUser, trigger: 'blur' }],
          support: {
            query: {},
            add: {},
          },
        },
        {
          id: 'port',
          name: 'port',
          width: 80,
          support: {
            query: {},
            add: {
              type: 'number',
            },
            edit: {
              type: 'number',
            },
          },
        },

        {
          id: 'activityId',
          name: 'showId',
          width: 100,
          valueType: 'slot',
          support: {
            add: {
              type: 'number',
            },
            edit: {
              type: 'number',
            },
          },
        },
        {
          id: 'activityName',
          minWidth: 100,
          name: 'show',
          valueType: 'slot',
          support: {
            query: {},
          },
        },


        {
          id: 'showOrders',
          name: 'showOrders',
          width: 67,
          support: {
            edit: {
            },
            add: {
              defaultValue: 0,
            },
          },
        },
        // {
        //   id: 'dateOrder',
        //   name: '日期序号',
        //   width: 50,
        //   support: {
        //     edit: {
        //       type: 'number',
        //     },
        //     add: {
        //       defaultValue: 0,
        //       type: 'number',
        //     },
        //   },
        // },

        {
          id: 'phone',
          name: 'phone',
          required: true,
          width: 90,

          support: {
            add: {},
            query: {},
            edit: {},
          },
        },
        {
          id: 'password',
          name: 'password',
          width: 10,
          isShow: false,
          required: true,
          support: {
            add: {},
            query: {},
            edit: {},
          },
        },

        {
          id: 'targetTypes',
          name: 'target',
          valueType: 'slot',
          options: [],
          support: {
            query: {
              type: 'input',
            },
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
        {
          id: 'remark',
          name: 'remark',
          width: 100,
          support: {
            query: {},
            add: {},
            edit: {},
          },
        },
        // {
        //   id: 'recordTime',
        //   name: '创建时间',
        //   width: 100,
        //   formatter: val => val && val.replace(/\..*$/, ''),
        // },
        {
          id: 'hasSuccess',
          name: '是否成功',
          width: 100,
          isShow: false,
          support: {
            edit: {
              type: 'select',
            },
          },
          options: [
            { id: true, name: '是' },
            { id: false, name: '否' },
          ],
        },

        {
          id: 'uid',
          name: 'uid',
          width: 170,
          isShow: false,
          support: {
            edit: {},
            add: {},
          },
        },
      ],
    };
  },
  computed: {
    title() {
      let { activityName, username, targetTypes } = this.curRow || {};
      return `${username}__${activityName}_${targetTypes?.join('_')}`;
    },
  },
  watch: {
    isUnique() {
      this.getList();
    },
    isHideFre() {
      this.getList();
    },
  },
  created() {
    this.pcName = getComputerName();
    eventBus.on('getUserList', this.getList);
  },
  unmounted() {
    eventBus.off('getUserList', this.getList);
  },

  methods: {
    toTop() {
      document.querySelector('.top').scrollIntoView();
    },
    async validateUser(rule, value, callback) {
      let hasDirs = await readDir('userData');
      if (hasDirs.includes(value)) {
        callback(new Error('已经有了'));
        return;
      }
      callback();
    },

    copyText(str) {
      copyText(str);
      ElNotification({
        title: '成功',
        message: '复制成功',
        type: 'success',
      });
    },
    async toOrder(row) {
      if (!row.status) {
        cmd('npm run pay ' + row.username);
      } else {
        await ElMessageBox.confirm('运行中,是否终止?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await this.stop(row);

        cmd('npm run pay ' + row.username);
      }
    },
    async stop(row) {
      let pid = this.pidInfo[this.getCmd(row)];
      await axios.get('http://127.0.0.1:5000/close/' + pid);
      delete this.pidInfo[this.cmd];
      this.getList();
    },
    tableRowClassName({ row, rowIndex }) {
      if (row.remark && row.remark.includes('频繁')) {
        return 'grey';
      }
      let colors = ['blue', 'green'];
      if (rowIndex === 0) {
        row.color = colors[0];
      } else if (Number(row.port) === Number(this.tableData[rowIndex - 1].port)) {
        row.color = this.tableData[rowIndex - 1].color;
      } else {
        let preColor = this.tableData[rowIndex - 1].color;
        row.color = colors.find(one => one !== preColor);
      }
      return row.color;
    },
    async send() {
      this.sending = true;
      let obj = await this.getConfigFile();
      let config = obj[this.curRow.username];
      let res = await axios.post(
        'http://127.0.0.1:5000/copyUserFile',
        { username: this.curRow.username, host: getRemoteIp(this.remotePc), config },
        {
          timeout: 30000,
        },
      );
      this.sending = false;
      if (res.data.code === 0) {
        ElNotification({
          title: '成功',
          message: '复制成功',
          type: 'success',
        });
        // this.remove(this.curRow);

        await ElMessageBox.confirm(`复制完成,删除配置【${this.curRow.username}】?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await this.remove(this.curRow, true);
        this.getList();
      } else {
        ElNotification({
          title: '失败',
          message: res,
          type: 'error',
        });
        getIp();
      }
      this.remoteDialogVisible = false;
    },
    async copyToRemote(row) {
      this.curRow = row;
      console.log(11111, row);
      this.remoteDialogVisible = true;
    },
    beforeAssignToTable({ records }) {
      this.tableData = records;
    },
    exit() {
      this.dialogVisible = false;
      this.curRow.status = 0;
    },
    getList() {
      return this.$refs.table.getList();
    },
    async copy({ username }) {
      let { value } = await ElMessageBox.prompt('', '输入新用户');
      let { value: phone } = await ElMessageBox.prompt('', '用户手机号');
      let { value: password } = await ElMessageBox.prompt('', '密码');

      this.loading = true;
      await this.cmdCopy(value, username, phone, password);
      this.isUnique = false;

      this.$refs.table.resetQuery(true);
      await this.getList();
      this.loading = false;

      let target = this.tableData.find(one => one.username === value);
      this.start(target);
    },
    handleClose() {
      this.getList();
    },
    cmdCopy(value, username, phone, password) {
      return new Promise(r => {
        let val = `npm run add ${value} ${true} ${username}-${phone}-${password}-${''}-${''}-${0}`;
        cmd(val, data => {
          if (data === 'done') {
            r();
          }
        });
      });
    },
    getCmd(row) {
      let cmds = Object.keys(this.pidInfo);
      let runningCmd = cmds.find(cmd => cmd.split(/\s+/)[3] === row.username);
      let cmd = runningCmd || row.cmd + ' ' + (this.isShow ? '1 true' : '');
      return cmd.trim();
    },
    start(row) {
      this.curRow = row;
      this.cmd = this.getCmd(row);
      console.log(this.cmd);
      this.dialogVisible = true;
      row.status = 1;
    },
    async handlerAdd(val) {
      let obj = { ...val };
      if (obj.showOrders !== undefined) {
        obj.orders = String(obj.showOrders).split(',').map(one => Number(one));
        delete obj.showOrders;
      }
      await this.updateFile({ key: val.username, val: obj, isAdd: true });
      await this.getList();
      let target = this.tableData.find(one => one.username === val.username);
      this.start(target);
    },
    async handleEdit(val) {
      let obj = { ...val };
      let noSaveFields = ['ticketTypes', 'username', 'color', 'status', 'cmd'];
      noSaveFields.forEach(one => {
        delete obj[one];
      });
      if (obj.uid) {
        obj.uid = obj.uid.replace('尊敬的用户，你的UID是：', '');
      }
      if (obj.showOrders) {
        obj.orders = obj.showOrders.split(',').map(one => Number(one));
        delete obj.showOrders;
      }
      await this.updateFile({
        key: val.username,
        val: obj,
      });
      await this.$refs.table.getList();
    },
    async updateFile({ key, val, isAdd }) {
      let fileData = await this.getConfigFile();
      if (isAdd && fileData[key] !== undefined) {
        throw new Error('已经有了' + key);
      }
      fileData[key] = val;
      await writeFile('config.json', JSON.stringify(fileData, null, 4));
    },
    async onDialogOpen(form) {
      let target = this.items.find(one => one.id === 'targetTypes');
      target.options = (form.ticketTypes || []).map(one => ({ id: one, name: one }));
      return form;
    },
    async remove(obj, noShowConfirm) {
      if (!noShowConfirm) {
        await ElMessageBox.confirm(`确定删除【${obj.username}】?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
      }
      await new Promise(r => {
        cmd(`npm run remove  ${obj.username}`, data => {
          if (data === 'done') {
            r();
          }
        });
      });
      await this.getList();
    },
    async getConfigFile() {
      let str = await readFile('config.json');
      return JSON.parse(str);
    },

    async getData({ queryItems }) {
      let obj = await this.getConfigFile();
      let data = Object.entries(obj).map(([key, val]) => ({
        ...val,
        ticketTypes: Object.values(val.skuIdToTypeMap || []),
        username: key,
      }));

      try {
        let items = queryItems.filter(item => item.value);
        data = data.filter(one => {
          return items.every(({ value, column }) => String(one[column]).indexOf(value) !== -1);
        });
        data.sort((a, b) => Number(b.port) - Number(a.port));


        let cmds = Object.keys(this.pidInfo);
        data.forEach(one => {
          let cmd = `npm run start ${one.username}`;
          one.cmd = cmd;
          one.hasSuccess = Boolean(one.hasSuccess);
          one.status = cmds.some(cmd => cmd.split(/\s+/)[3] === one.username) ? 1 : 0;
          if(!one.orders){
            console.log(one);
          }
          one.showOrders = one.orders?.join(',');
        });
        data = data.filter(one =>
          this.isHideFre ? !(one.remark && one.remark.includes('频繁')) : true,
        );

        if (this.isUnique) {
          let activityIds = [...new Set(data.map(one => Number(one.activityId)))];
          this.tableData = activityIds.map(activityId =>
            data.find(one => Number(one.activityId) === activityId),
          );
        } else {
          this.tableData = data;
        }
        console.log(1, this.tableData);

        return {
          total: this.tableData.length,
          records: this.tableData,
        };
      } catch (e) {
        console.log(e);
      }


    },
  },
};
</script>
<style lang="scss" scoped>
.config-manage {
  position: relative;

  .to-top {
    // z-index: 222;
    position: fixed;
    bottom: 40px;
    cursor: pointer;
    left: 10px;
  }

  .table-page-container {
    padding-top: 0;
  }

  .copy-icon {
    position: relative;
    top: 3px;
    cursor: pointer;
    margin-right: 5px;
  }
}
</style>

<style lang="scss">
.el-table {
  color: white;
}

.el-table .blue {
  --el-table-tr-bg-color: rgba(69, 123, 199, 0.5);
}

.el-table .green {
  // --el-table-tr-bg-color: rgba(72, 94, 125, 0.5);
}

.el-table .grey {
  --el-table-tr-bg-color: rgba(35, 35, 35, 0.5);
}

.el-dropdown-link {
  width: 100%;
  padding: 15px 25px;
}
</style>
