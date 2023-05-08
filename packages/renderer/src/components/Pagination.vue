<template>
  <div
    :class="{hidden: hidden}"
    class="pagination-container"
  >
    <el-pagination
      v-bind="$attrs"
      background
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import scrollTo from '/@/utils/scroll-to';

export default {
  name: 'MyPagination',
  props: {
    autoScroll: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
  },
  emits:['update:page-sizes','change','update:current-page'],
  computed: {},
  methods: {
    handleSizeChange(val) {
      console.log(val);
      this.$emit('update:page-sizes', val);
      this.$emit('change');
      if (this.autoScroll) {
        scrollTo(0, 800);
      }
    },
    handleCurrentChange(val) {
      console.log(val);
      this.$emit('update:current-page', val);
      this.$emit('change');
      if (this.autoScroll) {
        scrollTo(0, 800);
      }
    },
  },
};
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 10px;
  border: 1px solid #dfe6ec;
  border-top: 0px;
}
.pagination-container.hidden {
  display: none;
}
</style>
