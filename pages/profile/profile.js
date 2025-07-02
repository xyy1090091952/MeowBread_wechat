// pages/profile/profile.js
const mistakeManager = require('../../utils/mistakeManager.js');
const statisticsManager = require('../../utils/statisticsManager.js');

Page({
  data: {
    userInfo: null, // 初始化用户信息为null
    isLoggedIn: false, // 初始化登录状态为false
    avatarUrl: '', // 用于存储临时头像路径（用户选择的头像）
    nickname: '', // 用于存储用户输入的昵称
    userTitle: '新人さん', // 用户称号（根据答题数量动态变化）
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

  // 用户选择头像时的回调函数（原微信API方式）
  onChooseAvatar: function (e) {
    const { avatarUrl } = e.detail; // 获取用户选择的头像路径
    console.log('用户选择的头像路径:', avatarUrl); // 调试信息
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
        console.log('选择头像失败：', err);
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
      userTitle: '新人さん', // 重置称号
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
    
    console.log('加载的真实统计数据:', realStatistics); // 调试信息
    
    this.setData({
      statistics: realStatistics,
      mistakeCount: mistakeCount
    });
    
    // 更新用户称号
    this.updateUserTitle(realStatistics.totalQuestions);
  },

  // 根据答题数量更新用户称号
  updateUserTitle: function(totalQuestions) {
    let title = '新人さん 🌱'; // 默认称号（0-49题）
    
    // 10个进阶称号，一个比一个厉害！ ✨
    if (totalQuestions >= 50000) {
      title = '言葉の神 ⚡'; // 50000+ 单词之神
    } else if (totalQuestions >= 20000) {
      title = '辞書マスター 📜'; // 20000+ 辞典大师
    } else if (totalQuestions >= 10000) {
      title = '語彙王 👑'; // 10000+ 词汇之王
    } else if (totalQuestions >= 5000) {
      title = '単語仙人 🧙‍♂️'; // 5000+ 单词仙人
    } else if (totalQuestions >= 2000) {
      title = '言語達人 🎯'; // 2000+ 语言达人
    } else if (totalQuestions >= 1000) {
      title = '記憶武士 ⚔️'; // 1000+ 记忆武士
    } else if (totalQuestions >= 500) {
      title = '単語忍者 🥷'; // 500+ 单词忍者
    } else if (totalQuestions >= 200) {
      title = '学習者 📖'; // 200+ 学习者
    } else if (totalQuestions >= 100) {
      title = '背単語生 📚'; // 100+ 背单词学生
    } else if (totalQuestions >= 50) {
      title = '初心者 🌸'; // 50+ 初心者
    }
    
    console.log(`用户答题数: ${totalQuestions}, 获得称号: ${title}`); // 调试信息
    
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
