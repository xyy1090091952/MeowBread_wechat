// pages/profile/profile.js
Page({
  data: {
    userInfo: null, // 初始化用户信息为null
    isLoggedIn: false, // 初始化登录状态为false
    avatarUrl: '', // 用于存储临时头像路径
    nickname: '', // 用于存储用户输入的昵称
    statistics: {
      totalQuestions: 0,
      correctAnswers: 0,
      averageAccuracy: 0
    },
    mistakes: [
      // 错题列表
    ]
  },
  onLoad: function (options) {
    // 页面加载时，尝试从本地缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
      this.loadStatistics(); // 如果已登录，加载统计信息
      this.loadMistakes(); // 如果已登录，加载错题信息
    }
  },
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl: avatarUrl,
    });
  },
  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value
    });
  },
  login: function () {
    if (!this.data.avatarUrl) {
      wx.showToast({
        title: '请选择头像',
        icon: 'none'
      });
      return;
    }
    if (!this.data.nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    const userInfo = {
      avatarUrl: this.data.avatarUrl,
      nickName: this.data.nickname
    };
    wx.setStorageSync('userInfo', userInfo); // 将用户信息保存到本地缓存
    this.setData({
      userInfo: userInfo,
      isLoggedIn: true
    });
    this.loadStatistics(); // 登录成功后加载统计信息
    this.loadMistakes(); // 登录成功后加载错题信息
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
  },
  logout: function () {
    // 登出逻辑
    wx.removeStorageSync('userInfo'); // 清除本地缓存的用户信息
    this.setData({
      isLoggedIn: false,
      userInfo: null, // 清空用户信息
      statistics: { // 重置统计数据
        totalQuestions: 0,
        correctAnswers: 0,
        averageAccuracy: 0
      },
      mistakes: [] // 清空错题列表
    });
    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    });
  },
  loadStatistics: function () {
    // 加载统计信息
    // 这里应该从后端或本地存储加载实际的统计数据
  },
  loadMistakes: function () {
    // 加载错题
    // 这里应该从后端或本地存储加载实际的错题数据
  }
})
