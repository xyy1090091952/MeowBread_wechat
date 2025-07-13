// pages/knowledge/knowledge.js
const { KnowledgeCardsDB } = require('../../data/knowledge_cards.js');

Page({
  data: {
    categories: [
      { id: 1, name: 'N5', cardCount: 0 },
      { id: 2, name: 'N4', cardCount: 0 },
      { id: 3, name: 'N3', cardCount: 0 },
      { id: 4, name: 'N2', cardCount: 0 },
      { id: 5, name: 'N1', cardCount: 0 }
    ],
    selectedCategory: 1, // 默认选中第一个分类
    grammarCards: [], // 将从数据库动态加载
    containerWidth: 0, // 动态计算的容器宽度
    pageLoaded: false, // 控制页面渐显动画
    contentLoaded: false, // 控制内容卡片载入动画
    isFirstLoad: true // 标记是否首次加载
  },
  onLoad: function (options) {
    // 初始化数据
    this.initializeData();
    // 页面首次加载时执行的逻辑
    this.triggerPageAnimation();
    // 标记已完成首次加载
    this.setData({ isFirstLoad: false });
  },

  /**
   * 初始化数据 - 从数据库加载卡片数据
   */
  initializeData: function() {
    // 更新分类卡片数量
    const categories = this.data.categories.map(category => ({
      ...category,
      cardCount: KnowledgeCardsDB.getCardCountByLevel(category.name)
    }));

    // 加载默认分类的卡片数据
    const defaultLevel = this.data.categories[0].name; // N5
    const grammarCards = KnowledgeCardsDB.getCompleteCardsByLevel(defaultLevel);

    // 计算容器宽度
    const containerWidth = this.calculateContainerWidth(grammarCards.length);

    this.setData({
      categories: categories,
      grammarCards: grammarCards,
      containerWidth: containerWidth
    });

    console.log('初始化数据完成:', {
      categories: categories,
      grammarCards: grammarCards,
      containerWidth: containerWidth
    });
  },

  /**
   * 计算容器宽度 - 根据卡片数量动态计算
   * @param {number} cardCount - 卡片数量
   * @returns {number} 容器宽度 (rpx)
   */
  calculateContainerWidth: function(cardCount) {
    if (cardCount === 0) return 0;
    
    const cardWidth = 400; // 卡片宽度
    const cardSpacing = 280; // 卡片间距 (调整为280rpx)
    const rightPadding = 48; // 右边距
    
    // 计算最后一张卡片的位置
    const lastCardPosition = (cardCount - 1) * cardSpacing;
    
    // 总宽度 = 最后一张卡片位置 + 卡片宽度 + 右边距
    const totalWidth = lastCardPosition + cardWidth + rightPadding;
    
    console.log(`计算容器宽度: ${cardCount}张卡片 -> ${totalWidth}rpx`);
    return totalWidth;
  },





  /**
   * 选择分类按钮 - 处理用户点击分类按钮的事件
   * @param {Object} e - 事件对象，包含被点击按钮的数据
   */
  selectCategory: function (e) {
    const categoryId = parseInt(e.currentTarget.dataset.id);
    
    console.log(`点击分类ID: ${categoryId}`);
    
    // 根据分类ID获取对应的级别名称
    const selectedCategoryData = this.data.categories.find(cat => cat.id === categoryId);
    const levelName = selectedCategoryData ? selectedCategoryData.name : 'N5';
    
    // 从数据库加载对应级别的卡片数据
    const grammarCards = KnowledgeCardsDB.getCompleteCardsByLevel(levelName);
    
    // 计算新的容器宽度
    const containerWidth = this.calculateContainerWidth(grammarCards.length);
    
    // 更新数据
    this.setData({
      selectedCategory: categoryId,
      grammarCards: grammarCards,
      containerWidth: containerWidth,
      contentLoaded: false // 重置内容动画
    });
    
    console.log(`加载${levelName}级别卡片:`, grammarCards);
    console.log(`容器宽度更新为: ${containerWidth}rpx`);
    
    // 延迟启动内容动画
    setTimeout(() => {
      this.setData({ contentLoaded: true });
    }, 100);
  },

  /**
   * 打开卡片详情页面 - 跳转到相应页面（本地页面或webview）
   */
  openCardDetail: function (e) {
    const cardId = parseInt(e.currentTarget.dataset.id);
    console.log('打开卡片详情:', cardId);
    
    // 根据cardId找到对应的卡片数据
    const selectedCard = this.data.grammarCards.find(card => card.id === cardId);
    
    if (selectedCard && selectedCard.webUrl) {
      const cardTitle = selectedCard.title || '知识详情';
      console.log('即将打开:', selectedCard.webUrl);
      console.log('卡片标题:', cardTitle);
      
      // 判断是本地页面还是外部链接
      if (selectedCard.webUrl.startsWith('/pages/')) {
        // 本地页面跳转
        wx.navigateTo({
          url: selectedCard.webUrl,
          success: () => {
            console.log('跳转本地页面成功');
          },
          fail: (err) => {
            console.error('跳转本地页面失败:', err);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none',
              duration: 2000
            });
          }
        });
      } else {
        // 外部链接，跳转到webview页面
        const encodedUrl = encodeURIComponent(selectedCard.webUrl);
        wx.navigateTo({
          url: `/pages/webview/webview?url=${encodedUrl}&title=${cardTitle}`,
          success: () => {
            console.log('跳转webview页面成功');
          },
          fail: (err) => {
            console.error('跳转webview页面失败:', err);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none',
              duration: 2000
            });
          }
        });
      }
    } else {
      // 如果找不到对应的卡片或URL，显示提示
      wx.showToast({
        title: '暂无相关内容',
        icon: 'none',
        duration: 2000
      });
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 重要的：更新自定义底部导航的选中状态，确保高亮正确
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
