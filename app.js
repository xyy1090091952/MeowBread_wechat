// app.js
const coinManager = require('./utils/coinManager'); // 引入金币管理器
const imageManager = require('./utils/imageManager');
const imageList = require('./data/imageList');

App({
  onLaunch() {
    // 小程序启动时执行的逻辑
    console.log('App launched');
    
    // 初始化用户数据（金币、奖品等）
    coinManager.initializeUserData();

    // 预加载图片
    imageManager.preloadImages(imageList);
  },
  globalData: {
    // 全局共享的数据
    userInfo: null,
    currentParticleId: '', // 当前选中的粒子效果ID
  }
});
