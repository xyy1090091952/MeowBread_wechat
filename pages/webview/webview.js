Page({
  data: {
    webviewUrl: '', // 要显示的网页URL
    pageTitle: '知识详情' // 页面标题
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {Object} options - 页面参数，包含要显示的URL和标题
   */
  onLoad: function (options) {
    console.log('WebView页面加载参数:', options);
    
    // 从页面参数中获取URL和标题
    const { url, title } = options;
    
    if (url) {
      // URL解码，因为传递时可能被编码了
      const decodedUrl = decodeURIComponent(url);
      this.setData({
        webviewUrl: decodedUrl,
        pageTitle: title || '知识详情'
      });
      
      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: this.data.pageTitle
      });
      
      console.log('即将加载网页:', decodedUrl);
    } else {
      // 如果没有URL参数，显示错误信息
      wx.showToast({
        title: '缺少网页地址参数',
        icon: 'none',
        duration: 2000
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * webview加载完成事件
   */
  onWebViewLoad: function(e) {
    console.log('WebView加载完成:', e);
  },

  /**
   * webview加载错误事件
   */
  onWebViewError: function(e) {
    console.error('WebView加载错误:', e);
    wx.showModal({
      title: '网页加载失败',
      content: '网页可能暂时无法访问或不支持在小程序中显示，请稍后重试。',
      showCancel: false,
      confirmText: '返回',
      success: () => {
        wx.navigateBack();
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 隐藏tabbar（如果有的话）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().hide();
    }
  }
}) 