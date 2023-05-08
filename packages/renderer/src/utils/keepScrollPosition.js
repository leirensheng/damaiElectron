export default {
  data() {
    return {
      weakMap: new WeakMap(),
    };
  },
  mounted() {
    this.wrapDom = this.$el.nextElementSibling.querySelector(this.scrollWrapSelector);
    if (!this.wrapDom) {
      const className = this.scrollWrapSelector.replace(/#|\./, '');
      if (this.$el.classList.contains(className)) {
        this.wrapDom = this.$el;
      } else {
        return;
      }
    }
    this.wrapDom.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    if (this.wrapDom) {
      this.wrapDom.removeEventListener('scroll', this.handleScroll);
    }
  },
  activated() {
    if (this.weakMap.has(this.wrapDom)) {
      setTimeout(() => {
        console.log(this.weakMap.get(this.wrapDom));
        this.wrapDom.scrollTop = this.weakMap.get(this.wrapDom);
      }, 0);
    }
  },
  methods: {
    saveScrollPosition(scrollTop) {
      this.weakMap.set(this.wrapDom, scrollTop);
    },
    handleScroll(e) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.saveScrollPosition(e.target.scrollTop);
      }, 500);
    },
  },
};
