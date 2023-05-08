import {defineStore} from 'pinia';
export const useStore = defineStore('global', {
  state: () => {
    return {
      pidInfo: {},
      failCmds: [],
    };
  },
  actions: {
    setPidInfo(val) {
      this.pidInfo = val;
    },
    setFailCmds(val) {
      this.failCmds = val;
    },
  },
  getters: {},
});
