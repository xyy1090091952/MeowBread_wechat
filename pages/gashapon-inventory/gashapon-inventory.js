// pages/gashapon-inventory/gashapon-inventory.js
// 使用新的数据管理器，提供更好的数据访问体验 ✨
const { gashaponData, PrizeDataManager } = require('../../data/gashapon-prizes-config.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 自定义导航栏所需的高度信息
    statusBarHeight: 0,
    navBarHeight: 0,
    supplyPrizes: [], // 美味补给原始数据
    magicPrizes: [], // 梦幻魔法原始数据
    displayPrizes: [], // 当前显示的数据
    currentSwiperIndex: 0, // 当前选中的索引
    scrollLeft: 0,
    currentSeriesId: 1, // 当前选中的系列ID，1为美味补给，2为梦幻魔法
    isAnimating: false, // 控制图片动画状态,
    collectedCount: 0, // 当前系列已收集数量
    totalCount: 0, // 当前系列总数
    currentParticleId: '', // 当前选中的粒子效果ID
    supplyParticleId: '', // 美味补给系列的粒子效果ID
    magicParticleId: '', // 梦幻魔法系列的粒子效果ID
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置导航栏高度
    const windowInfo = wx.getWindowInfo();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight,
      navBarHeight: menuButtonInfo.height + (menuButtonInfo.top - windowInfo.statusBarHeight) * 2,
    });
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次进入页面都刷新，确保解锁状态最新
   */
  onShow() {
    this.loadPrizes();
    this.loadParticleSettings();
  },

  /**
   * @description 加载并处理所有奖品数据 (使用新数据管理器优化)
   */
  loadPrizes() {
    const unlockedIds = coinManager.getUnlockedPrizes() || [];
    
    // 使用数据管理器获取分类数据，更加清晰和高效 ✨
    const supplyPrizes = PrizeDataManager.getPrizesBySeriesId(2).map(prize => ({
      ...prize,
      unlocked: unlockedIds.includes(prize.id)
    }));
    
    const magicPrizes = PrizeDataManager.getPrizesBySeriesId(1).map(prize => ({
      ...prize,
      unlocked: unlockedIds.includes(prize.id)
    }));

    // 根据当前currentSeriesId设置显示的奖品
    const isSupply = this.data.currentSeriesId === 1;
    const currentDisplayPrizes = isSupply ? supplyPrizes : magicPrizes;
    const collectedCount = currentDisplayPrizes.filter(p => p.unlocked).length;
    const totalCount = currentDisplayPrizes.length;
    
    this.setData({
      supplyPrizes,
      magicPrizes,
      displayPrizes: currentDisplayPrizes, // 直接使用实际数据
      collectedCount,
      totalCount,
      currentSwiperIndex: 0, // 重置到第一个
    }, () => {
      this.centerActiveThumbnail();
    });
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack();
  },

  switchTab(e) {
    const seriesId = parseInt(e.currentTarget.dataset.id);
    if (this.data.currentSeriesId !== seriesId && !this.data.isAnimating) {
      const newDisplayPrizes = seriesId === 1 ? this.data.supplyPrizes : this.data.magicPrizes;
      
      // 重新计算收集进度
      const collectedCount = newDisplayPrizes.filter(p => p.unlocked).length;
      const totalCount = newDisplayPrizes.length;
      
      // 根据切换的系列设置对应的粒子效果ID
      const currentParticleId = seriesId === 1 ? this.data.supplyParticleId : this.data.magicParticleId;

      this.setData({
        isAnimating: true,
        currentSeriesId: seriesId,
        displayPrizes: newDisplayPrizes,
        collectedCount, // 更新收集数量
        totalCount,     // 更新总数
        currentSwiperIndex: 0, // 切换后重置索引
        currentParticleId, // 更新当前粒子效果ID
      }, () => {
        this.centerActiveThumbnail();
        
        // 动画结束后重置状态
        setTimeout(() => {
          this.setData({
            isAnimating: false
          });
        }, 600);
      });
    }
  },

  /**
   * @description 点击缩略图切换奖品
   */
  switchSwiper(e) {
    const targetIndex = parseInt(e.currentTarget.dataset.index);
    
    if (this.data.currentSwiperIndex !== targetIndex && !this.data.isAnimating) {
      this.setData({
        isAnimating: true,
        currentSwiperIndex: targetIndex
      }, () => {
        // 触发Q弹动画
        this.triggerJellyAnimation();
        
        // 居中显示选中的缩略图
        this.centerActiveThumbnail();
        
        // 600ms后重置动画状态
        setTimeout(() => {
          this.setData({
            isAnimating: false
          });
        }, 600);
      });
    }
  },

  /**
   * @description 将当前选中的缩略图滚动到中心位置
   */
  centerActiveThumbnail() {
    const query = wx.createSelectorQuery().in(this);
    const windowWidth = wx.getWindowInfo().windowWidth;
    
    // 使用当前索引来定位缩略图
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
  },

  /**
   * @description 触发Q弹动画效果
   * 为切换时的视觉反馈提供动画效果
   */
  triggerJellyAnimation() {
    // 可以在这里添加具体的动画逻辑
    // 比如给某个元素添加动画类名，然后在CSS中定义动画效果
    console.log('触发Q弹动画效果');
    
    // 示例：如果需要给特定元素添加动画类名
    // 可以通过setData更新某个控制动画的状态
    // this.setData({
    //   jellyAnimation: true
    // });
    
    // 然后在一定时间后移除动画状态
    // setTimeout(() => {
    //   this.setData({
    //     jellyAnimation: false
    //   });
    // }, 300);
  },

  /**
   * @description 加载粒子效果设置
   */
  loadParticleSettings() {
    try {
      const supplyParticleId = wx.getStorageSync('supplyParticleId') || '';
      const magicParticleId = wx.getStorageSync('magicParticleId') || '';
      // 根据当前系列设置currentParticleId
      const currentParticleId = this.data.currentSeriesId === 1 ? supplyParticleId : magicParticleId;
      
      this.setData({
        supplyParticleId,
        magicParticleId,
        currentParticleId
      });
    } catch (error) {
      console.error('加载粒子设置失败:', error);
    }
  },

  /**
   * @description 保存粒子效果设置
   * @param {string} particleId 粒子效果ID
   * @param {number} seriesId 系列ID
   */
  saveParticleSettings(particleId, seriesId) {
    try {
      const storageKey = seriesId === 1 ? 'supplyParticleId' : 'magicParticleId';
      wx.setStorageSync(storageKey, particleId);
    } catch (error) {
      console.error('保存粒子设置失败:', error);
    }
  },

  /**
   * @description 切换粒子效果
   * @param {Object} e 事件对象
   */
  toggleParticleEffect(e) {
    const prizeId = e.currentTarget.dataset.prizeId;
    const currentSeriesId = this.data.currentSeriesId;
    const newParticleId = this.data.currentParticleId === prizeId ? '' : prizeId;
    
    // 更新对应系列的粒子效果ID
    const updateData = {
      currentParticleId: newParticleId
    };
    
    if (currentSeriesId === 1) {
      updateData.supplyParticleId = newParticleId;
    } else {
      updateData.magicParticleId = newParticleId;
    }
    
    this.setData(updateData);
    
    // 保存设置
    this.saveParticleSettings(newParticleId, currentSeriesId);
    
    // 通知首页更新粒子效果（使用当前激活的粒子效果）
    const app = getApp();
    if (app.globalData) {
      app.globalData.currentParticleId = newParticleId;
    }
    
    // 显示提示
    const particleName = newParticleId ? this.data.displayPrizes.find(p => p.id === prizeId)?.name : '关闭';
    const seriesName = currentSeriesId === 1 ? '美味补给' : '梦幻魔法';
    wx.showToast({
      title: `${seriesName}粒子效果：${particleName}`,
      icon: 'none',
      duration: 1500
    });
  }
})