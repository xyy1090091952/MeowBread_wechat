// components/textbook-selector/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    /**
     * @description 当前选中的课本ID
     * @type {String}
     */
    currentBookId: {
      type: String,
      value: null
    }
  },

  observers: {
    'visible': function(newVal, oldVal) {
      if (newVal && !oldVal) {
        // 当弹窗显示时，自动选中当前正在使用的课本
        this.setData({
          selectedBookId: this.data.currentBookId
        });
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
   * 组件的初始数据
   */
  data: {
    textbooks: [],
    selectedBookId: null, // 用于暂存用户选择的课本ID
    dictionaries: [],
    modalAnimationClass: '' // 弹窗动画类名
  },

  lifetimes: {
    attached() {
      this.loadTextbooks();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    loadTextbooks() {
      const db = require('../../database/dictionaries.js').dictionaries;
      const textbooks = db.map(dict => {
        const coverMap = {
          'everyones_japanese': '../../images/book/dajia.jpg',
          'liangs_class': '../../images/book/liang.jpg',
          'liangs_intermediate': '../../images/book/liang2.jpg',
          'duolingguo': '../../images/book/duolingguo.jpg'
        };
        let wordCount = 0;
        dict.lesson_files.forEach(filePath => {
          try {
            const lesson = require('../../database/' + filePath);
            if (Array.isArray(lesson)) {
              wordCount += lesson.length;
            } else if (Array.isArray(lesson.words)) {
              wordCount += lesson.words.length;
            }
          } catch (err) {
            console.warn('无法加载课时文件', filePath);
          }
        });
        return { ...dict, wordCount, cover: coverMap[dict.id] || '' };
      });
      this.setData({ textbooks });
    },

    handleClose() {
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

    // 用户点击课本卡片，暂存选择
    onBookTap(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({ selectedBookId: id });
    },

    // 用户点击确认按钮，发送最终选择
    onConfirm() {
      if (this.data.selectedBookId) {
        const selectedDictionary = this.data.textbooks.find(book => book.id === this.data.selectedBookId);
        this.triggerEvent('select', { selectedDictionary });
      }
    }
  }
})