// components/textbook-selector/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  observers: {
    'visible': function(isVisible) {
      console.log('TextbookSelector visibility changed to:', isVisible);
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    textbooks: [],
    selectedBookId: null // 用于暂存用户选择的课本ID
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
      this.triggerEvent('close');
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
      } else {
        // 如果用户未选择任何课本就点击确认，可以给一个提示
        wx.showToast({
          title: '请先选择一本课本',
          icon: 'none'
        });
      }
    }
  }
})