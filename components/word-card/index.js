Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onLongPress: function() {
      // 冒泡一个长按事件，让父组件（word-list）可以监听到
      this.triggerEvent('wordlongpress', { word: this.data.item });
    }
  }
})