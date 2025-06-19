// pages/knowledge/knowledge.js
Page({
  data: {
    categories: [
      { id: 1, name: '动词变化' },
      { id: 2, name: '语法结构' },
      { id: 3, name: '词汇分类' },
      // 添加更多类别...
    ],
    currentCategory: null,
    content: ''
  },
  onLoad: function (options) {
    // 页面加载时执行的逻辑
  },
  selectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({
      currentCategory: this.data.categories.find(cat => cat.id === categoryId)
    })
    // 这里应该根据选中的类别加载相应的内容
    this.loadContent(categoryId)
  },
  loadContent: function (categoryId) {
    // 模拟加载内容的过程
    const content = `这里是关于${this.data.currentCategory.name}的内容。
    这个函数应该从后端或本地存储加载实际的内容。`
    this.setData({ content })
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
  }
})
