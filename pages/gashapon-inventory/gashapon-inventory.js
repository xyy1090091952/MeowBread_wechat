// pages/gashapon-inventory/gashapon-inventory.js
const { gashaponData } = require('../gashapon/gashapon-prizes.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({

  /**
   * 页面的初始数据
   */
  data: {
    allPrizes: [], // 存储所有奖品（包含解锁状态）
    currentSwiperIndex: 0, // 当前swiper的索引
    scrollLeft: 0, // 缩略图导航的滚动位置
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 页面加载时不需要重复加载，onShow会处理
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次进入页面都刷新，确保解锁状态最新
   */
  onShow() {
    this.loadPrizes();
  },

  /**
   * @description 加载并处理所有奖品数据 (已重构)
   */
  loadPrizes() {
    // 从 coinManager 获取已解锁的奖品ID列表
    const unlockedIds = coinManager.getUnlockedPrizes() || [];
    // 将所有奖池的奖品合并到一个数组中
    const allPrizes = gashaponData.flatMap(pool => pool.prizes);

    // 为每个奖品添加 unlocked 状态
    const processedPrizes = allPrizes.map(prize => {
      return {
        ...prize,
        unlocked: unlockedIds.includes(prize.id)
      };
    });

    this.setData({
      allPrizes: processedPrizes
    }, () => {
      // 数据加载完成后，居中第一个元素
      this.centerActiveThumbnail();
    });
  },

  /**
   * @description Swiper切换时触发
   */
  onSwiperChange(e) {
    this.setData({
      currentSwiperIndex: e.detail.current
    }, () => {
      this.centerActiveThumbnail();
    });
  },

  /**
   * @description 点击缩略图切换Swiper
   */
  switchSwiper(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.currentSwiperIndex !== index) {
      this.setData({
        currentSwiperIndex: index
      }, () => {
        this.centerActiveThumbnail();
      });
    }
  },

  /**
   * @description 将当前选中的缩略图滚动到中心位置
   */
  centerActiveThumbnail() {
    const query = wx.createSelectorQuery().in(this);
    const windowWidth = wx.getWindowInfo().windowWidth;
    
    query.select(`#thumb-${this.data.currentSwiperIndex}`).boundingClientRect();
    query.select('.thumbnail-nav').scrollOffset();
    
    query.exec((res) => {
      if (res[0] && res[1]) {
        const thumbCenter = res[0].left + res[0].width / 2;
        const navCenter = windowWidth / 2;
        const targetScrollLeft = res[1].scrollLeft + thumbCenter - navCenter;
        
        this.setData({
          scrollLeft: targetScrollLeft
        });
      }
    });
  }
})