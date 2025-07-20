// pages/profile/profile.js
const mistakeManager = require('../../utils/mistakeManager.js');
const statisticsManager = require('../../utils/statisticsManager.js');
const userTitleManager = require('../../utils/userTitleManager.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({
  data: {
    userInfo: null, // 初始化用户信息为null
    isLoggedIn: false, // 初始化登录状态为false
    avatarUrl: '', // 用于存储临时头像路径（用户选择的头像）
    nickname: '', // 用于存储用户输入的昵称
    userTitle: '菜鸡 🐣', // 用户称号（根据答题数量动态变化）
    statistics: {
      totalQuestions: 0,   // 总答题数量
      correctAnswers: 0,   // 正确答题数量
      averageAccuracy: 0   // 平均准确率
    },
    mistakeCount: 0, // 错题数量
    userCoins: 0, // 用户金币数量
    pageLoaded: false, // 控制页面渐显动画
    breadBouncing: false // 控制面包弹跳动画状态
  },

  // 页面加载时的初始化逻辑
  onLoad: function (options) {
    // 检查用户登录状态
    this.checkLoginStatus();
    
    // 获取错题数量
    this.getMistakeCount();
    
    // 获取用户统计数据
    this.getUserStatistics();
    
    // 获取用户金币数量
    this.updateUserCoins();
  },

  // 检查用户登录状态
  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      });
      
      // 只有在登录后才触发加载动画
      this.triggerLoadAnimation();
      
      // 加载统计数据
      this.loadStatistics();
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null,
        pageLoaded: false // 登录前不显示动画
      });
      
      // 设置默认头像
      this.getUserProfile();
    }
  },

  // 触发加载动画 - 只在登录后调用
  triggerLoadAnimation: function() {
    // 重置动画状态
    this.setData({
      pageLoaded: false
    });
    
    // 延迟触发动画，确保页面渲染完成
    setTimeout(() => {
      this.setData({
        pageLoaded: true
      });
    }, 100);
  },

  // 获取错题数量
  getMistakeCount: function() {
    const mistakeCount = mistakeManager.getMistakeList().length;
    this.setData({
      mistakeCount: mistakeCount
    });
  },

  // 获取用户统计数据
  getUserStatistics: function() {
    const statistics = statisticsManager.getOverallStatistics();
    this.setData({
      statistics: statistics
    });
  },

  // 更新用户金币数量
  updateUserCoins: function() {
    const userCoins = coinManager.getCoins();
    this.setData({
      userCoins: userCoins
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    // 不再在这里统一触发动画，而是根据登录状态来决定是否播放动画
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

  // 用户选择头像时的回调函数（原微信API方式）
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail; // 获取用户选择的头像路径
    
    this.setData({
      avatarUrl: avatarUrl, // 更新头像路径到页面数据
    });
    
    // 显示选择成功提示
    wx.showToast({
      title: '头像选择成功',
      icon: 'success',
      duration: 1500
    });
  },

  // 手动选择头像方法（自定义按钮使用）
  chooseAvatarManually: function() {
    const that = this;
    wx.chooseMedia({
      count: 1, // 只选择一张图片
      mediaType: ['image'], // 只选择图片
      sourceType: ['album', 'camera'], // 可以从相册选择或拍照
      maxDuration: 30,
      camera: 'back',
      success(res) {
        // 选择成功后更新头像
        that.setData({
          avatarUrl: res.tempFiles[0].tempFilePath
        });
      },
      fail(err) {
        // 选择头像失败的处理
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
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
    if (!this.data.nickname || this.data.nickname.trim() === '') {
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
    
    // 登录成功后触发加载动画
    this.triggerLoadAnimation();
    
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
    // 注意：这里不清除统计数据，保留用户的答题记录
    // 如果需要清除统计数据，可以取消注释下一行
    // statisticsManager.clearAllStatistics();
    
    this.setData({
      isLoggedIn: false,
      userInfo: null, // 清空用户信息
      userTitle: '菜鸡 🐣', // 重置称号
      statistics: { // 重置统计数据显示
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
    // 加载真实的统计信息
    const realStatistics = statisticsManager.getOverallStatistics();
    
    // 获取错题数量
    const mistakeCount = mistakeManager.getMistakeList().length;
    
    // 获取用户等级称号信息（基于已背单词数量）
    const userTitleInfo = userTitleManager.getCurrentUserTitleInfo();
    
    console.log('加载的真实统计数据:', realStatistics); // 调试信息
    console.log('用户等级称号信息:', userTitleInfo); // 调试信息
    
    this.setData({
      statistics: realStatistics,
      mistakeCount: mistakeCount,
      userTitle: userTitleInfo.fullTitle // 使用完整称号（含emoji）
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

  // 跳转到陈列馆
  goToGallery: function() {
    wx.navigateTo({
      url: '/pages/gashapon-inventory/gashapon-inventory'
    });
  },


  // 面包点击事件 - 触发Q弹动画
  onBreadTap: function() {
    // 如果动画正在进行中，则不重复触发
    if (this.data.breadBouncing) {
      return;
    }
    
    // 触发弹跳动画
    this.setData({
      breadBouncing: true
    });
    
    // 动画播放完成后重置状态（动画持续0.8秒）
    setTimeout(() => {
      this.setData({
        breadBouncing: false
      });
    }, 800);
    
    // 添加点击反馈
    wx.vibrateShort({
      type: 'light' // 轻微震动反馈
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('Profile page onShow');
    // 检查登录状态，以防在其他页面进行了登录/登出操作
    this.checkLoginStatus();
    
    // 更新用户金币数量（可能在其他页面有变化）
    this.updateUserCoins();

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
  }
})
