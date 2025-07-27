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
    currentSeriesId: 2, // 当前选中的系列ID，1为美味补给，2为梦幻魔法（默认显示梦幻魔法）
    isAnimating: false, // 控制图片动画状态,
    collectedCount: 0, // 当前系列已收集数量
    totalCount: 0, // 当前系列总数
    currentParticleId: '', // 当前选中的粒子效果ID
    supplyParticleId: '', // 美味补给系列的粒子效果ID
    magicParticleId: '', // 梦幻魔法系列的粒子效果ID
    returnTo: '', // 返回目标页面，用于控制返回逻辑 ✨
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
      returnTo: options.returnTo || '', // 保存返回目标参数 ✨
    });
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次进入页面都刷新，确保解锁状态最新
   */
  onShow() {
    this.loadPrizes();
    this.loadParticleSettings();
    
    // 🔧 修复逻辑：确保梦幻魔法系列正确初始化「麻瓜」默认状态
    if (this.data.currentSeriesId === 2) {
      this.ensureMagicSeriesDefaultState();
    }
    
    // 确保美味补给系列的默认状态正确
    if (this.data.currentSeriesId === 1) {
      this.ensureSupplySeriesDefaultState();
    }
  },

  /**
   * @description 加载并处理所有奖品数据 (使用新数据管理器优化)
   */
  loadPrizes() {
    const unlockedIds = coinManager.getUnlockedPrizes() || [];
    
    // 使用数据管理器获取分类数据，更加清晰和高效 ✨
    const supplyPrizes = PrizeDataManager.getPrizesBySeriesId(2).map(prize => ({
      ...prize,
      // 「普通面包」奖品默认解锁，无需抽奖
      unlocked: prize.id === 'FOOD-DEFAULT-01' ? true : unlockedIds.includes(prize.id)
    }));
    
    const magicPrizes = PrizeDataManager.getPrizesBySeriesId(1).map(prize => ({
      ...prize,
      // 「麻瓜」奖品默认解锁，无需抽奖
      unlocked: prize.id === 'FX-DEFAULT-01' ? true : unlockedIds.includes(prize.id)
    }));

    // 根据当前currentSeriesId设置显示的奖品
    const isSupply = this.data.currentSeriesId === 1;
    const currentDisplayPrizes = isSupply ? supplyPrizes : magicPrizes;
    // 计算收集状态时排除默认奖品（不计入收集统计）
    const collectedCount = currentDisplayPrizes.filter(p => 
      p.unlocked && p.id !== 'FX-DEFAULT-01' && p.id !== 'FOOD-DEFAULT-01'
    ).length;
    const totalCount = currentDisplayPrizes.filter(p => 
      p.id !== 'FX-DEFAULT-01' && p.id !== 'FOOD-DEFAULT-01'
    ).length;
    
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
   * 根据returnTo参数决定返回目标 ✨
   */
  onBack() {
    if (this.data.returnTo === 'profile') {
      // 如果指定返回到个人中心，使用reLaunch跳转
      wx.reLaunch({
        url: '/pages/profile/profile'
      });
    } else {
      // 正常返回上一页
      wx.navigateBack();
    }
  },

  switchTab(e) {
    const seriesId = parseInt(e.currentTarget.dataset.id);
    if (this.data.currentSeriesId !== seriesId && !this.data.isAnimating) {
      const newDisplayPrizes = seriesId === 1 ? this.data.supplyPrizes : this.data.magicPrizes;
      
      // 重新计算收集进度（排除默认奖品）
      const collectedCount = newDisplayPrizes.filter(p => 
        p.unlocked && p.id !== 'FX-DEFAULT-01' && p.id !== 'FOOD-DEFAULT-01'
      ).length;
      const totalCount = newDisplayPrizes.filter(p => 
        p.id !== 'FX-DEFAULT-01' && p.id !== 'FOOD-DEFAULT-01'
      ).length;
      
      // 🔧 修复逻辑：根据切换的系列设置对应的粒子效果ID
      let currentParticleId = seriesId === 1 ? this.data.supplyParticleId : this.data.magicParticleId;
      
      // 如果切换到梦幻魔法系列，检查粒子效果设置
      if (seriesId === 2) {
        const unlockedIds = require('../../utils/coinManager.js').getUnlockedPrizes() || [];
        const hasOtherMagicPrizes = unlockedIds.some(id => id.startsWith('FX-') && id !== 'FX-DEFAULT-01');
        
        // 如果用户没有其他梦幻魔法奖品，或者保存的粒子效果ID用户没有解锁
        if (!hasOtherMagicPrizes || (currentParticleId && !unlockedIds.includes(currentParticleId))) {
          currentParticleId = 'FX-DEFAULT-01'; // 默认使用「麻瓜」状态
          // 同时更新本地存储和data中的magicParticleId
          wx.setStorageSync('magicParticleId', currentParticleId);
          this.setData({
            magicParticleId: currentParticleId
          });
        }
      }
      
      // 如果切换到美味补给系列，检查粒子效果设置
      if (seriesId === 1) {
        const unlockedIds = require('../../utils/coinManager.js').getUnlockedPrizes() || [];
        const hasOtherSupplyPrizes = unlockedIds.some(id => id.startsWith('FOOD-') && id !== 'FOOD-DEFAULT-01');
        
        // 如果用户没有其他美味补给奖品，或者保存的粒子效果ID用户没有解锁
        if (!hasOtherSupplyPrizes || (currentParticleId && !unlockedIds.includes(currentParticleId))) {
          currentParticleId = 'FOOD-DEFAULT-01'; // 默认使用「普通面包」状态
          // 同时更新本地存储和data中的supplyParticleId
          wx.setStorageSync('supplyParticleId', currentParticleId);
          this.setData({
            supplyParticleId: currentParticleId
          });
        }
      }

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
   * 添加重试机制，解决最后几个缩略图定位失败的问题 ✨
   */
  centerActiveThumbnail(retryCount = 0) {
    // 确保在页面准备好后再执行查询
    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this);
      // 同时查询滚动视图的滚动位置和尺寸
      query.select('.thumbnail-scroll').fields({
        scrollOffset: true, // 获取滚动位置
        rect: true,         // 获取尺寸信息
      });
      // 查询当前激活的缩略图的尺寸和位置
      query.select(`#thumbnail-${this.data.selectedPrizeId}`).boundingClientRect();
      query.exec(res => {
        // res[0] 是 .thumbnail-scroll 的信息
        // res[1] 是 #thumbnail-... 的信息
        if (res && res[0] && res[1]) {
          const scrollViewInfo = res[0];
          const activeThumbnailInfo = res[1];

          // 计算目标滚动位置
          // 目标是让激活的缩略图中心对齐滚动视图的中心
          // 滚动位置 = 缩略图左侧偏移 + 当前滚动条位置 - (滚动视图宽度 / 2) + (缩略图宽度 / 2)
          const scrollLeft = activeThumbnailInfo.left + scrollViewInfo.scrollLeft - (scrollViewInfo.right - scrollViewInfo.left) / 2 + activeThumbnailInfo.width / 2;

          this.setData({
            thumbnailScrollLeft: scrollLeft
          });
        } else {
          // 如果查询失败，并且重试次数小于最大次数，则延迟后重试
          if (retryCount < 3) {
            this.centerActiveThumbnail(retryCount + 1);
          } else {
            // 如果多次尝试后仍然失败，则使用备用方案
            this.fallbackCenterThumbnail();
          }
        }
      });
    }, retryCount === 0 ? 100 : 50); // 首次调用延迟100ms，重试时延迟50ms
  },

  /**
   * @description 备用的缩略图居中方案
   * 当DOM查询失败时使用计算方式进行定位
   */
  fallbackCenterThumbnail() {
    const windowWidth = wx.getWindowInfo().windowWidth;
    // 根据实际CSS样式：缩略图宽度144rpx，右边距16rpx，左侧padding 48rpx
    const thumbnailWidth = 144 * (windowWidth / 750); // 144rpx转换为px
    const thumbnailMargin = 16 * (windowWidth / 750); // 16rpx转换为px
    const leftPadding = 48 * (windowWidth / 750); // 48rpx转换为px
    const totalThumbnailWidth = thumbnailWidth + thumbnailMargin;
    
    // 计算目标滚动位置：考虑左侧padding和当前索引
    const targetScrollLeft = leftPadding + this.data.currentSwiperIndex * totalThumbnailWidth + thumbnailWidth / 2 - windowWidth / 2;
    const finalScrollLeft = Math.max(0, targetScrollLeft);
    
    this.setData({
      scrollLeft: finalScrollLeft
    });
    
    console.log(`使用备用定位方案: index=${this.data.currentSwiperIndex}, scrollLeft=${finalScrollLeft}, windowWidth=${windowWidth}`);
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
   * @description 确保梦幻魔法系列的默认状态正确
   */
  ensureMagicSeriesDefaultState() {
    const unlockedIds = require('../../utils/coinManager.js').getUnlockedPrizes() || [];
    const hasOtherMagicPrizes = unlockedIds.some(id => id.startsWith('FX-') && id !== 'FX-DEFAULT-01');
    
    // 如果用户没有其他梦幻魔法奖品，确保使用「麻瓜」状态
    if (!hasOtherMagicPrizes) {
      const defaultParticleId = 'FX-DEFAULT-01';
      this.setData({
        magicParticleId: defaultParticleId,
        currentParticleId: defaultParticleId
      });
      // 同时更新本地存储
      wx.setStorageSync('magicParticleId', defaultParticleId);
    }
  },

  /**
   * @description 确保美味补给系列的默认状态正确
   */
  ensureSupplySeriesDefaultState() {
    const unlockedIds = require('../../utils/coinManager.js').getUnlockedPrizes() || [];
    const hasOtherSupplyPrizes = unlockedIds.some(id => id.startsWith('FOOD-') && id !== 'FOOD-DEFAULT-01');
    
    // 如果用户没有其他美味补给奖品，确保使用「普通面包」状态
    if (!hasOtherSupplyPrizes) {
      const defaultParticleId = 'FOOD-DEFAULT-01';
      this.setData({
        supplyParticleId: defaultParticleId,
        currentParticleId: defaultParticleId
      });
      // 同时更新本地存储
      wx.setStorageSync('supplyParticleId', defaultParticleId);
    }
  },

  /**
   * @description 加载粒子效果设置
   */
  loadParticleSettings() {
    try {
      let supplyParticleId = wx.getStorageSync('supplyParticleId') || '';
      let magicParticleId = wx.getStorageSync('magicParticleId') || '';
      
      // 🔧 修复逻辑：检查梦幻魔法系列的粒子效果设置
      if (this.data.currentSeriesId === 2) { // 梦幻魔法系列
        const unlockedIds = require('../../utils/coinManager.js').getUnlockedPrizes() || [];
        const hasOtherMagicPrizes = unlockedIds.some(id => id.startsWith('FX-') && id !== 'FX-DEFAULT-01');
        
        // 如果用户没有其他梦幻魔法奖品，或者保存的粒子效果ID用户没有解锁
        if (!hasOtherMagicPrizes || (magicParticleId && !unlockedIds.includes(magicParticleId))) {
          magicParticleId = 'FX-DEFAULT-01'; // 默认使用「麻瓜」状态
          // 同时更新本地存储
          wx.setStorageSync('magicParticleId', magicParticleId);
        }
      }
      
      // 🔧 修复逻辑：检查美味补给系列的粒子效果设置
      if (this.data.currentSeriesId === 1) { // 美味补给系列
        const unlockedIds = require('../../utils/coinManager.js').getUnlockedPrizes() || [];
        const hasOtherSupplyPrizes = unlockedIds.some(id => id.startsWith('FOOD-') && id !== 'FOOD-DEFAULT-01');
        
        // 如果用户没有其他美味补给奖品，或者保存的粒子效果ID用户没有解锁
        if (!hasOtherSupplyPrizes || (supplyParticleId && !unlockedIds.includes(supplyParticleId))) {
          supplyParticleId = 'FOOD-DEFAULT-01'; // 默认使用「普通面包」状态
          // 同时更新本地存储
          wx.setStorageSync('supplyParticleId', supplyParticleId);
        }
      }
      
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
   * @description 装备奖品（区分美味补给和梦幻魔法）
   * - 美味补给（seriesId: 1）只影响答题页的横幅（banner），不改变粒子效果。
   * - 梦幻魔法（seriesId: 2）会改变全局的粒子效果。
   * @param {Object} e 事件对象
   */
  toggleParticleEffect(e) {
    const prizeId = e.currentTarget.dataset.prizeId;
    const currentSeriesId = this.data.currentSeriesId;

    // 根据系列（美味补给/梦幻魔法）执行不同的逻辑
    if (currentSeriesId === 1) { // --- 美味补给系列 ---
      // 如果点击的已经是当前装备的横幅，则不作任何操作
      if (this.data.supplyParticleId === prizeId) {
        console.log('🚫 该美味补给已在使用中:', prizeId);
        return;
      }
      
      console.log('🍞 装备新的美味补给:', prizeId);
      this.setData({
        supplyParticleId: prizeId,
        currentParticleId: prizeId // 更新UI，让选中框正确显示
      });
      // 只保存美味补给的ID，不影响全局粒子效果
      wx.setStorageSync('supplyParticleId', prizeId);

      wx.showToast({ title: '美味加载成功', icon: 'none' });

    } else { // --- 梦幻魔法系列 ---
      // 如果点击的已经是当前装备的粒子效果，则不作任何操作
      if (this.data.magicParticleId === prizeId) {
        console.log('🚫 该魔法效果已在施展中:', prizeId);
        return;
      }

      console.log('✨ 装备新的魔法效果:', prizeId);
      this.setData({
        magicParticleId: prizeId,
        currentParticleId: prizeId // 更新UI
      });
      // 保存当前系列的选择
      wx.setStorageSync('magicParticleId', prizeId);
      // 同步到全局粒子效果
      wx.setStorageSync('currentParticleId', prizeId);

      // 更新全局变量，确保立即生效
      const app = getApp();
      if (app.globalData) {
        app.globalData.currentParticleId = prizeId;
      }
      
      wx.showToast({ title: '魔法施展完毕', icon: 'none' });
    }
    
    console.log('🎨 装备切换完成:', {
      prizeId,
      series: currentSeriesId === 1 ? '美味补给' : '梦幻魔法'
    });
  }
})