<template>
  <div>
    <div class="ping">
      <el-input
        v-model="remoteTestIp"
        placeholder="远程ip"
        @contextmenu.prevent="rightClick"
      ></el-input>
      <el-button
        type="primary"
        @click="ping"
      >
        连通性测试
      </el-button>
    </div>
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
    <S-Table
      v-show="remotePc"
      ref="table"
      :table-row-class-name="tableRowClassName"
      :highlight-current-row="false"
      :is-auto-height="true"
      :items="items"
      :api="loadConfig"
      one-page-hide-pagination
      :search-immediately="false"
      :table-btns-config="tableBtnsConfig"
      @before-assign-to-table="beforeAssignToTable"
    >
      <template #username="{row}">
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
          </el-dropdown>
        </div>
      </template>

      <template #targetTypes="{row}">
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
  </div>
</template>

<script>
import {getComputerName, cloneRemoteConfig, getRemoteIp, doTwice} from '#preload';
import axios from 'axios';
import {ElNotification} from 'element-plus';
import {readClip} from '#preload';
import {getIp} from '/@/utils/index.js';

export default {
  data() {
    return {
      types: ['', 'success', 'danger', 'warning'],

      remotePc: '',
      pcs: ['新电脑', '虚拟机4.3', '虚拟机4.4', '惠普'],
      pcName: '',
      data: [],
      remoteTestIp: '',
      tableData: [],
      items: [
        {
          id: 'hasSuccess',
          name: 'isSuccess',
          isShow: false,
          options: [
            {name: '是', id: true},
            {name: '否', id: false},
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
          support: {
            query: {},
          },
        },
        {
          id: 'port',
          name: 'port',
          width: 80,
          support: {
            query: {},
          },
        },

        {
          id: 'activityId',
          name: 'showId',
          width: 100,
        },
        {
          id: 'activityName',
          minWidth: 200,
          name: 'show',
          support: {
            query: {},
          },
        },
        {
          id: 'showTime',
          name: 'showTime',
          width: 110,
        },

        {
          id: 'nameIndex',
          name: 'order',
          width: 67,
        },

        {
          id: 'phone',
          name: 'phone',
          required: true,
          support: {
            query: {},
          },
        },

        {
          id: 'targetTypes',
          name: 'target',
          valueType: 'slot',
          options: [],
        },
        {
          id: 'ticketTypes',
          name: '所有类型',
          isShow: false,
          //  valueType:'text',
        },
        {
          id: 'remark',
          name: 'remark',
          width: 100,
          support: {
            query: {},
          },
        },

        {
          id: 'hasSuccess',
          name: '是否成功',
          width: 100,
          isShow: false,
          options: [
            {id: true, name: '是'},
            {id: false, name: '否'},
          ],
        },

        {
          id: 'uid',
          name: 'uid',
          width: 170,
          isShow: false,
        },
      ],
      tableBtnsConfig: [
        {
          type: 'success',
          handler: this.clone,
          show: row => row.status === 0,
          name: '拉取',
        },
        {
          type: 'danger',
          handler: this.stop,
          show: row => row.status === 1,
          name: '停止',
        },
      ],
    };
  },
  computed: {
    remoteIp() {
      return getRemoteIp(this.remotePc);
    },
  },
  watch: {
    remotePc() {
      this.getList();
    },
  },
  created() {
    this.pcName = getComputerName();
    console.log(this.pcName);
  },
  methods: {
    async stop({pid}) {
      await axios(`http://${this.remoteIp}:5000/close/${pid}?isFromRemote=1`);
      this.getList();
    },
    beforeAssignToTable({records}) {
      this.tableData = records;
    },
    getList() {
      return this.$refs.table.getList();
    },
    tableRowClassName({row, rowIndex}) {
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
    rightClick() {
      this.remoteTestIp = readClip().replace(':5678', '');
    },
    async ping() {
      let startTime = Date.now();
      await axios(`http://${this.remoteTestIp}:5000/ping`);
      let timeUsed = Date.now() - startTime;
      ElNotification({
        title: '成功',
        message: timeUsed + 'ms',
        type: 'success',
      });
    },
    async clone(row) {
      let {username, config} = row;
      row.loading = true;
      try {
        let fn = doTwice(cloneRemoteConfig, this.remoteIp);
        await fn(username, JSON.parse(JSON.stringify(config)));
        ElNotification({
          title: '成功',
          message: '拉取成功',
          type: 'success',
        });
        this.getList();
      } catch (e) {
        ElNotification({
          title: '失败',
          message: e.message,
          type: 'error',
        });
      }
      row.loading = false;
    },
    async loadConfig({queryItems}) {
      try {
        this.data = [];

        let send = ip =>
          axios({
            timeout: 7000,
            url: `http://${ip}:5000/getAllUserConfig`,
          });

        let fn = doTwice(send, this.remoteIp);

        let {
          data: {
            data: {config, pidToCmd},
          },
        } = await fn();

        let cmds = Object.values(pidToCmd);

        let cmdToPid = {};
        Object.entries(pidToCmd).forEach(([key, value]) => {
          cmdToPid[value.replace(' show', '')] = key;
        });
        let data = Object.entries(config).map(([username, one]) => ({
          username,
          ...one,
          config: one,
        }));

        let items = queryItems.filter(item => item.value);
        data = data.filter(one => {
          return items.every(({value, column}) => String(one[column]).indexOf(value) !== -1);
        });
        data.sort((a, b) => Number(b.port) - Number(a.port));

        data.forEach(one => {
          let cmd = `npm run start ${one.username}`;
          one.cmd = cmd;
          one.loading = false;
          one.hasSuccess = Boolean(one.hasSuccess);
          one.status = cmds.some(cmd => cmd.replace(/\s+show/, '') === one.cmd) ? 1 : 0;
          one.pid = cmdToPid[cmd];
        });
        this.tableData = data;

        return {
          total: this.tableData.length,
          records: this.tableData,
        };
      } catch (e) {
        ElNotification({
          title: '失败',
          message: e.message,
          type: 'error',
        });
        getIp();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.res {
  margin-top: 20px;
}

.item {
  padding: 10px;
  display: flex;
  gap: 15px;
  border-bottom: 1px solid white;

  .name {
    width: 5%;
  }

  .activity {
    width: 70%;
  }
}

.ping {
  margin: 20px 0;
  display: flex;
  align-items: center;

  :first-child {
    width: 200px;
  }

  :last-child {
    flex-grow: 0;
    width: auto;
  }
}
</style>
