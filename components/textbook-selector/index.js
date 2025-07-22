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
      // 封面图片现在从 dictionaries.js 中直接获取，不再需要本地的 coverMap
        // 初始化词汇量为0
        let wordCount = 0;
        // 创建一个Promise数组来处理所有的异步请求
        const promises = dict.lesson_files.map(filePath => {
          return new Promise((resolve, reject) => {
            wx.request({
              url: filePath,
              success: (res) => {
                if (res.statusCode === 200 && Array.isArray(res.data)) {
                  // 请求成功，累加词汇量
                  wordCount += res.data.length;
                  resolve();
                } else {
                  // 数据格式不正确或请求失败
                  console.warn(`加载失败或数据格式不正确: ${filePath}`);
                  resolve(); // 即使失败也resolve，避免阻塞其他请求
                }
              },
              fail: (err) => {
                console.error(`无法加载课时文件: ${filePath}`, err);
                resolve(); // 同样，失败也resolve
              }
            });
          });
        });

        // 当所有请求都完成后，更新UI
        Promise.all(promises).then(() => {
          const updatedTextbooks = this.data.textbooks.map(book => {
            if (book.id === dict.id) {
              return { ...book, wordCount };
            }
            return book;
          });
          this.setData({ textbooks: updatedTextbooks });
        });

        return { ...dict, wordCount: '加载中', cover: dict.cover_image || '' };
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