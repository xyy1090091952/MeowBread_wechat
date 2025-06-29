// app.js
App({
  onLaunch() {
    // 小程序启动时执行的逻辑
    console.log('App launched')
    // 发送 res.code 到后台换取 openId, sessionKey, unionId
  },
  globalData: {
    // 全局共享的数据
    userInfo: null
  }
})
