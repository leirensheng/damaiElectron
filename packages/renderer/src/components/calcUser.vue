<template>
  <el-button @click="start">统计</el-button>
  <el-dialog
    v-model="dialogVisible"
    title="统计信息"
    width="80%"
  >
    <cmd-terminal2
      v-if="dialogVisible"
      ref="terminal"
      no-set-local-storage
      cmd="npm run calc"
      @exit="dialogVisible = false"
    ></cmd-terminal2>
  </el-dialog>
</template>

<script>
export default {
  data() {
    return {
      dialogVisible: false,
      msg: '',
    };
  },
  watch: {
    dialogVisible(val) {
      if (!val) {
        this.$refs.terminal.close();
      }
    },
  },
  created() {},
  mounted() {},
  methods: {
    start() {
      this.dialogVisible = true;
    },
  },
};
</script>

<style scoped lang="scss"></style>
