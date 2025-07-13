// pages/gashapon-inventory/gashapon-inventory.js
const { gashaponData } = require('../gashapon/gashapon-prizes.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({

  /**
   * 页面的初始数据
   */
  data: {
    supplyPrizes: [], // 美味补给
    magicPrizes: [], // 梦幻魔法
    displayPrizes: [], // 当前显示
    currentSwiperIndex: 0,
    scrollLeft: 0,
    activeTab: 'supply', // 默认激活的tab
    tabs: [
      { id: 'supply', name: '美味补给' },
      { id: 'magic', name: '梦幻魔法' }
    ]
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
    const unlockedIds = coinManager.getUnlockedPrizes() || [];
    
    const supplyPrizes = [];
    const magicPrizes = [];

    gashaponData.forEach(pool => {
      const prizes = pool.prizes.map(prize => ({
        ...prize,
        unlocked: unlockedIds.includes(prize.id)
      }));
      
      if (pool.name === '人类口粮' || pool.name === '猫咪口粮') {
        supplyPrizes.push(...prizes);
      } else if (pool.name === '特效扭蛋') {
        magicPrizes.push(...prizes);
      }
    });

    this.setData({
      supplyPrizes,
      magicPrizes,
      displayPrizes: supplyPrizes // 默认显示美味补给
    }, () => {
      this.centerActiveThumbnail();
    });
  },

  switchTab(e) {
    const tabId = e.currentTarget.dataset.id;
    if (this.data.activeTab !== tabId) {
      this.setData({
        activeTab: tabId,
        displayPrizes: tabId === 'supply' ? this.data.supplyPrizes : this.data.magicPrizes,
        currentSwiperIndex: 0 // 切换后重置swiper
      }, () => {
        this.centerActiveThumbnail();
      });
    }
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