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
   * @param {object} options 页面启动参数，包含 prizeId 和 seriesId
   */
  onLoad(options) {
    console.log('结果页面接收到的参数:', options);
    
    // 从页面参数中获取系列ID (兼容新旧参数名)
    const seriesId = options.seriesId || options.poolId;
    if (seriesId) {
      // 将 seriesId 保存到页面数据中，方便"再抽一次"时使用
      const poolId = Number(seriesId);
      this.setData({ poolId });
      
      // 根据seriesId设置背景类型
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

    // 从页面参数中获取奖品信息 (支持新的prizeId参数)
    if (options.prizeId) {
      // 根据prizeId从数据管理器中获取完整的奖品信息
      const prize = PrizeDataManager.getPrizeById(options.prizeId);
      if (prize) {
        console.log('找到奖品信息:', prize);
        this.setData({ prize });
        // 播放入场动画
        this.playAnimation();
      } else {
        console.error('找不到奖品信息，prizeId:', options.prizeId);
        wx.showToast({
          title: '奖品信息获取失败',
          icon: 'error',
          duration: 2000
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    } else if (options.prizeData) {
      // 兼容旧的prizeData参数格式
      const prize = JSON.parse(decodeURIComponent(options.prizeData));
      this.setData({ prize });
      this.playAnimation();
    } else {
      // 如果没有奖品数据，这是一个异常情况
      console.error('缺少奖品参数');
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
   * @description "去陈列馆"按钮的点击事件，跳转到扭蛋陈列馆页面
   * 直接跳转到陈列馆，并传递返回目标参数，让陈列馆知道应该返回到个人中心 ✨
   */
  goToGallery() {
    wx.redirectTo({
      url: '/pages/gashapon-inventory/gashapon-inventory?returnTo=profile',
    });
  },

  /**
   * @description “好耶”按钮的点击事件，返回上一页
   */
  onConfirm() {
    wx.navigateBack();
  },
});