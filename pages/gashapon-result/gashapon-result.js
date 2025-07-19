// pages/gashapon-result/gashapon-result.js
// 使用新的数据管理器，提供更好的数据访问体验 ✨
const { gashaponData, PrizeDataManager } = require('../../data/gashapon-prizes-config.js');
const { drawPrize } = require('../../utils/gashapon-helper.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({

  /**
   * 页面的初始数据
   */
  data: {
    prize: null, // 当前展示的奖品信息
    poolId: null, // 当前奖品所属的奖池ID
    isAnimating: false, // 控制动画播放的状态
    backgroundType: 'supply', // 背景类型，默认为美味补给
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options 页面启动参数，包含 prizeData 和 poolId
   */
  onLoad(options) {
    // 从页面参数中获取奖池ID
    if (options.poolId) {
      // 将 poolId 保存到页面数据中，方便"再抽一次"时使用
      const poolId = Number(options.poolId);
      this.setData({ poolId });
      
      // 根据poolId设置背景类型
      const pool = gashaponData.find(p => p.id === poolId);
      if (pool) {
        let backgroundType = 'supply'; // 默认为美味补给
        if (pool.name === '梦幻魔法') {
          backgroundType = 'magic';
        } else if (pool.name === '美味补给') {
          backgroundType = 'supply';
        }
        this.setData({ backgroundType });
      }
    }

    // 从页面参数中获取奖品信息
    if (options.prizeData) {
      // prizeData 是一个 JSON 字符串，需要解析
      const prize = JSON.parse(decodeURIComponent(options.prizeData));
      this.setData({ prize });
      // 奖品已在抽奖页面（gashapon.js）的 onDraw 方法中记录，此处无需重复操作
      // 播放入场动画
      this.playAnimation();
    } else {
      // 如果没有奖品数据，这是一个异常情况
      wx.showToast({
        title: '奖品信息丢失',
        icon: 'error',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * @description 播放出场动画
   */
  playAnimation() {
    this.setData({ isAnimating: false });
    setTimeout(() => {
      this.setData({ isAnimating: true });
    }, 100);
  },

  /**
   * @description “再抽一次”按钮的点击事件 (已重构)
   */
  onDrawAgain() {
    if (this.data.poolId === null) {
      wx.showToast({ title: '奖池信息丢失', icon: 'none' });
      return;
    }

    const pool = gashaponData.find(p => p.id === this.data.poolId);
    if (!pool) {
      wx.showToast({ title: '奖池配置错误', icon: 'none' });
      return;
    }

    // 使用 coinManager 来检查并扣除金币
    if (!coinManager.spendCoins(pool.cost)) {
      wx.showToast({ title: '金币不足！', icon: 'none' });
      return;
    }

    console.log(`金币已扣除, 剩余: ${coinManager.getCoins()}`);

    // 执行抽奖逻辑
    const prizes = pool.prizes;
    const newPrize = prizes[Math.floor(Math.random() * prizes.length)];

    if (newPrize) {
      // 使用 coinManager 记录新解锁的奖品
      coinManager.addUnlockedPrize(newPrize.id);
      
      this.setData({ prize: newPrize });
      this.playAnimation();
    } else {
      wx.showToast({ title: '抽奖失败，请重试', icon: 'none' });
    }
  },

  /**
   * @description “好耶”按钮的点击事件，返回上一页
   */
  onConfirm() {
    wx.navigateBack();
  },
});