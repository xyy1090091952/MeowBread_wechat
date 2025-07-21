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
    modalAnimationClass: ''
  },

  observers: {
    'visible': function(visible) {
      if (visible) {
        this.setData({
          modalAnimationClass: 'modal-fade-in'
        });
      } else {
        this.setData({
          modalAnimationClass: 'modal-fade-out'
        });
      }
    }
  },

  methods: {
    // 关闭弹窗
    closePopup() {
      // 添加渐隐动画
      this.setData({
        modalAnimationClass: 'modal-fade-out'
      });
      
      // 动画完成后关闭弹窗，与question-type-popup保持一致的200ms延迟
      setTimeout(() => {
        this.setData({
          modalAnimationClass: ''
        });
        this.triggerEvent('close');
      }, 200);
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
      this.closePopup();
    }
  }
});