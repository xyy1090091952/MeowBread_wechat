// pages/knowledge/knowledge.js
Page({
  data: {
    categories: [
      { id: 1, name: 'N5', cardCount: 3 },
      { id: 2, name: 'N4', cardCount: 0 },
      { id: 3, name: 'N3', cardCount: 0 },
      { id: 4, name: 'N2', cardCount: 0 },
      { id: 5, name: 'N1', cardCount: 0 }
    ],
    selectedCategory: 1, // 默认选中第一个分类
    grammarCards: [
      {
        id: 1,
        category: 'GRAMMAR',
        subcategory: '接续',
        title: '动词变化表',
        backgroundImage: '/images/card/N5-Card1.jpg'
      },
      {
        id: 2,
        category: 'GRAMMAR',
        subcategory: '语法',
        title: '形容词变位',
        backgroundImage: '/images/card/N5-Card2.jpg'
      },
      {
        id: 3,
        category: 'GRAMMAR',
        subcategory: '句型',
        title: '基本句型',
        backgroundImage: '/images/card/N5-Card3.jpg'
      }
    ],
    pageLoaded: false, // 控制页面渐显动画
    contentLoaded: false, // 控制内容卡片载入动画
    isFirstLoad: true // 标记是否首次加载
  },
  onLoad: function (options) {
    // 页面首次加载时执行的逻辑
    this.triggerPageAnimation();
    // 标记已完成首次加载
    this.setData({ isFirstLoad: false });
  },



  /**
   * 选择分类按钮 - 处理用户点击分类按钮的事件
   * @param {Object} e - 事件对象，包含被点击按钮的数据
   */
  selectCategory: function (e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    
    console.log(`点击分类ID: ${categoryId}`);
    
    // 更新数据
    this.setData({
      selectedCategory: categoryId,
      contentLoaded: false // 重置内容动画
    });
    
    // 延迟启动内容动画
    setTimeout(() => {
      this.setData({ contentLoaded: true });
    }, 100);
  },

  /**
   * 打开卡片详情页面
   */
  openCardDetail: function (e) {
    const cardId = e.currentTarget.dataset.id;
    console.log('打开卡片详情:', cardId);
    // 这里可以跳转到详情页面
    // wx.navigateTo({
    //   url: `/pages/knowledge-detail/knowledge-detail?id=${cardId}`
    // });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const page = getCurrentPages().pop();
      const route = page.route;
      const tabList = this.getTabBar().data.tabList;
      const index = tabList.findIndex(item => item.pagePath === route);
      if (index !== -1) {
        this.getTabBar().updateSelected(index);
      }
    }
    
    // 只有在非首次加载时才重新播放动画（即tab切换回来时）
    if (!this.data.isFirstLoad) {
      console.log('Tab切换回知识库页面，重新播放动画');
      this.triggerPageAnimation();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   * 当切换到其他tab时，清空当前页面的动画状态
   */
  onHide() {
    console.log('知识库页面隐藏，清空动画状态');
    // 直接瞬间清空动画状态，不要过渡效果
    this.setData({
      pageLoaded: false,
      contentLoaded: false
    });
  },

  /**
   * 触发页面动画 - 统一的动画触发逻辑
   */
  triggerPageAnimation: function() {
    // 重置动画状态
    this.setData({ 
      pageLoaded: false,
      contentLoaded: false 
    });
    
    // 启动页面渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
      // 延迟启动内容卡片载入动画
      setTimeout(() => {
        this.setData({ contentLoaded: true });
      }, 300);
    }, 100);
  }
})
