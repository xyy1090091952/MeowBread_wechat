// components/question-type-popup/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    questionTypeOptions: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 内部维护一份临时的选项状态，以便用户可以取消操作
    internalOptions: [],
    modalAnimationClass: '' // 弹窗动画类名
  },

  observers: {
    'questionTypeOptions': function(newOptions) {
      // 当外部传入的选项变化时，深拷贝一份到内部
      this.setData({
        internalOptions: JSON.parse(JSON.stringify(newOptions))
      });
    },
    'visible': function(newVal, oldVal) {
      if (newVal && !oldVal) {
        // 弹窗显示时添加渐显动画
        this.setData({
          modalAnimationClass: ''
        });
        setTimeout(() => {
          this.setData({
            modalAnimationClass: 'modal-fade-in'
          });
        }, 50);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    closePopup() {
      // 添加渐隐动画
      this.setData({
        modalAnimationClass: 'modal-fade-out'
      });
      
      // 动画完成后关闭弹窗
      setTimeout(() => {
        this.setData({
          modalAnimationClass: ''
        });
        this.triggerEvent('close');
      }, 200);
    },

    preventPropagation() {
      // 阻止事件冒泡
    },

    onQuestionTypeChange(e) {
      const { value } = e.currentTarget.dataset;
      const checked = e.detail.value;
      const options = this.data.internalOptions;

      // 检查是否是最后一个被选中的选项
      const selectedCount = options.filter(opt => opt.checked).length;
      if (!checked && selectedCount === 1) {
        wx.showToast({
          title: '至少选择一种题型',
          icon: 'none'
        });
        // 恢复UI
        this.setData({ internalOptions: [...options] }); // 强制刷新
        return;
      }

      const newOptions = options.map(opt => {
        if (opt.value === value) {
          return { ...opt, checked };
        }
        return opt;
      });

      this.setData({ internalOptions: newOptions });
    },

    onConfirm() {
      const selectedTypes = this.data.internalOptions
        .filter(opt => opt.checked)
        .map(opt => opt.value);
      
      this.triggerEvent('confirm', { 
        selectedQuestionTypes: selectedTypes,
        questionTypeOptions: this.data.internalOptions
      });
      this.closePopup();
    }
  }
})