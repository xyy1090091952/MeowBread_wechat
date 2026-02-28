// components/course-filter-popup/index.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    dictionaries: {
      type: Array,
      value: []
    },
    selectedDictionaryIndex: {
      type: Number,
      value: 0
    }
  },

  data: {
    // 内部维护一个显示状态，用于控制动画
    // 因为父组件直接修改 visible 为 false 会导致弹窗瞬间消失，无法播放消失动画
    innerVisible: false
  },

  observers: {
    'visible': function(visible) {
      if (visible) {
        // 如果 visible 为 true，立即显示
        this.setData({ innerVisible: true });
      } else {
        // 如果 visible 为 false，不要立即隐藏 innerVisible
        // 而是让父组件通过 close 事件来处理关闭逻辑
        // 这里主要处理父组件强制关闭的情况（虽然较少见）
        // 如果此时 innerVisible 还是 true，说明还在显示，这里不主动设为 false
        // 而是依赖 closePopup 方法里的延时
      }
    }
  },

  methods: {
    // 关闭弹窗
    closePopup() {
      // 1. 先设置内部状态为 false，触发 CSS 的 transition 消失动画
      this.setData({ innerVisible: false });
      
      // 2. 等待动画播放完毕（300ms）后，再通知父组件真正关闭（销毁/隐藏）
      setTimeout(() => {
        this.triggerEvent('close');
      }, 300);
    },

    // 阻止事件冒泡
    preventPropagation() {
      // 阻止事件冒泡
    },

    // 选择词库
    onSelectDictionary(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('dictionaryChange', { 
        selectedDictionaryIndex: index,
        selectedDictionary: this.data.dictionaries[index]
      });
    },

    // 完成选择
    onConfirm() {
      // 检查是否选择了词库
      if (!this.data.dictionaries[this.data.selectedDictionaryIndex]) {
        wx.showToast({
          title: '请选择词库',
          icon: 'none'
        });
        return;
      }

      this.triggerEvent('confirm');
      // 确认后也需要播放消失动画
      this.closePopup();
    }
  }
});