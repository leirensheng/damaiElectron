<template>
  <div>
    <S-Table
      ref="table"
      :highlight-current-row="false"
      :is-auto-height="true"
      :items="items"
      :api="getData"
      one-page-hide-pagination
      :table-btns-config="tableBtnsConfig"
    >
    </S-Table>
  </div>
</template>

<script>
import {readFile, readDir, cmd} from '#preload';
import {useStore} from '/@/store/global';

export default {
  setup() {
    let store = useStore();
    let {pidInfo} = store;
    return {
      pidInfo,
    };
  },
  data() {
    return {
      tableBtnsConfig: [
        {
          handler: this.openOrder,
          name: '订单页',
          show: row => !row.status,
          type: 'success',
        },
        {
          name: '运行中',
          show: row => row.status,
          type: 'danger',
        },
      ],
      items: [
        {
          id: 'username',
          name: '用户名',
          width: 100,
          support: {
            query: {},
          },
        },
        {
          id: 'phone',
          name: '手机',
        },
        {
          id: 'activityName',
          name: '演出',
        },
      ],
    };
  },
  methods: {
    start() {},
    openOrder({username}) {
      cmd('npm run pay ' + username);
    },

    async getCheckFile() {
      let str = await readFile('config.json');
      return JSON.parse(str);
    },
    async getData({queryItems}) {
      let allUser = await readDir('userData');
      let allData = allUser.map(username => ({username}));

      let obj = await this.getCheckFile();
      Object.entries(obj).forEach(([key, val]) => {
        let curData = {
          activityName: val.activityName,
          phone: val.phone,
          username: key,
        };
        let targetIndex = allData.findIndex(one => one.username === key);
        allData[targetIndex] = curData;
      });

      let items = queryItems.filter(item => item.value);
      allData = allData.filter(one => {
        return items.every(({value, column}) => String(one[column]).indexOf(value) !== -1);
      });

      let cmds = Object.keys(this.pidInfo);
      allData.forEach(one => {
        one.status = cmds.some(cmd => cmd.includes(one.username)) ? 1 : 0;
      });
      return {
        total: allData.length,
        records: allData,
      };
    },
  },
};
</script>

<style></style>
