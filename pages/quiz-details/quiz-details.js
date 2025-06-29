Page({
  data: {
    pageLoaded: false // 控制页面渐显动画
  },

  onLoad: function (options) {
    // 页面加载完成后启动渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100);
  },

  onReady: function () {
    
  },

  onShow: function () {
    
  },

  onHide: function () {
    
  },

  onUnload: function () {
    
  }
}) 