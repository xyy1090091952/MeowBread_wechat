// pages/profile/profile.js
const mistakeManager = require('../../utils/mistakeManager.js');

Page({
  data: {
    userInfo: null, // 初始化用户信息为null
    isLoggedIn: false, // 初始化登录状态为false
    avatarUrl: '', // 用于存储临时头像路径（用户选择的头像）
    nickname: '', // 用于存储用户输入的昵称
    userTitle: '初来背词', // 用户称号（根据答题数量动态变化）
    statistics: {
      totalQuestions: 0,   // 总答题数量
      correctAnswers: 0,   // 正确答题数量
      averageAccuracy: 0   // 平均准确率
    },
    mistakeCount: 0, // 错题数量
    pageLoaded: false // 控制页面渐显动画
  },

  // 页面加载时的初始化逻辑
  onLoad: function (options) {
    // 尝试从本地缓存获取已保存的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo) {
      // 如果找到缓存的用户信息，说明用户之前已经登录过
      this.setData({
        userInfo: userInfo,    // 设置用户信息
        isLoggedIn: true       // 设置为已登录状态
      });
      this.loadStatistics(); // 加载用户的答题统计信息
    } else {
      // 如果没有缓存的用户信息，初始化为未登录状态
      this.getUserProfile(); // 设置默认头像
    }
    
    // 延迟启动页面渐显动画，提升用户体验
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100);
  },

  // 获取用户信息（微信头像和昵称）
  getUserProfile: function() {
    // 新版小程序推荐使用 open-type="chooseAvatar" 和 type="nickname" 的方式
    // 让用户主动选择头像和输入昵称，这里只设置默认头像
    this.setData({
      avatarUrl: '/images/icons/profile.png', // 默认头像
      nickname: '' // 空昵称，等待用户输入
    });
  },

  // 用户选择头像时的回调函数
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail; // 获取用户选择的头像路径
    this.setData({
      avatarUrl: avatarUrl, // 更新头像路径到页面数据
    });
  },

  // 用户输入昵称时的回调函数
  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value // 更新昵称到页面数据
    });
  },

  // 用户登录功能
  login: function () {
    // 检查是否已选择头像
    if (!this.data.avatarUrl || this.data.avatarUrl === '/images/icons/profile.png') {
      wx.showToast({
        title: '请选择头像',
        icon: 'none'
      });
      return;
    }
    // 检查是否已输入昵称
    if (!this.data.nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    // 构建用户信息对象
    const userInfo = {
      avatarUrl: this.data.avatarUrl, // 用户选择的头像
      nickName: this.data.nickname    // 用户输入的昵称
    };
    
    // 将用户信息保存到本地缓存，实现持久化存储
    wx.setStorageSync('userInfo', userInfo);
    
    // 更新页面状态为已登录
    this.setData({
      userInfo: userInfo,
      isLoggedIn: true
    });
    
    // 登录成功后加载用户的答题统计信息
    this.loadStatistics();

    // 显示登录成功提示
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
      userTitle: '初来背词', // 重置称号
      statistics: { // 重置统计数据
        totalQuestions: 0,
        correctAnswers: 0,
        averageAccuracy: 0
      },
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
    // 模拟数据，实际应该从API获取
    const mockStatistics = {
      totalQuestions: 150,
      correctAnswers: 120,
      averageAccuracy: 80
    };
    
    // 获取错题数量
    const mistakeCount = mistakeManager.getMistakeList().length;
    
    this.setData({
      statistics: mockStatistics,
      mistakeCount: mistakeCount
    });
    
    // 更新用户称号
    this.updateUserTitle(mockStatistics.totalQuestions);
  },

  // 根据答题数量更新用户称号
  updateUserTitle: function(totalQuestions) {
    let title = '初来背词'; // 默认称号
    
    if (totalQuestions >= 1000) {
      title = '单词大师';
    } else if (totalQuestions >= 100) {
      title = '背了一点';
    }
    
    this.setData({
      userTitle: title
    });
  },

  // 跳转到答题结果详细页面
  goToQuizDetails: function() {
    wx.navigateTo({
      url: '/pages/quiz-details/quiz-details'
    });
  },

  // 跳转到扭蛋机页面
  goToGashapon: function() {
    wx.navigateTo({
      url: '/pages/gashapon/gashapon'
    });
  },

  // 跳转到错题库
  goToMistakes: function() {
    wx.navigateTo({
      url: '/pages/mistakes/mistakes'
    });
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
    
    // 页面显示时重新加载统计信息
    if (this.data.isLoggedIn) {
      this.loadStatistics();
    }
  }
})
