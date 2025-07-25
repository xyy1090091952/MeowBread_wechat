// 引入扭蛋机数据和抽奖辅助函数
// 使用新的数据管理器，提供更好的数据访问体验 ✨
const { gashaponData, PrizeDataManager } = require('../../data/gashapon-prizes-config.js');
const { drawPrize, isSeriesCompleted, getSeriesProgress } = require('../../utils/gashapon-helper.js');
const coinManager = require('../../utils/coinManager.js'); // 引入金币管理器

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 自定义导航栏所需的高度信息
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonTop: 0, // 胶囊按钮顶部距离
    pageTitle: '扭蛋机', // 页面标题
    // 用户金币数量 (将从 coinManager 获取)
    userCoins: 0, 
    // 扭蛋系列列表
    seriesList: [],
    // 当前选中的扭蛋系列ID（调换后默认显示美味补给）
    currentSeriesId: 2,
    // 当前抽奖的消耗
    drawCost: 0,
    // swiper相关数据（调换后索引0对应系列2美味补给，索引1对应系列1梦幻魔法）
    swiperIndex: 0, // 默认显示索引0，即美味补给
    // 扭蛋机背景图片URL
    machineImageUrl: 'https://free.picui.cn/free/2025/07/26/6883c5e4b8633.jpg', // 默认显示美味补给的图片
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
      menuButtonTop: menuButtonInfo.bottom + 8,
    });

    // 初始化时更新系列进度和抽奖价格
    this.updateSeriesProgress();
    const initialSeries = gashaponData.find(series => series.id === this.data.currentSeriesId);
    this.setData({
      drawCost: initialSeries ? initialSeries.cost : 0, // 动态获取初始系列的消耗
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时，都更新金币数量和系列进度
    this.setData({
      userCoins: coinManager.getCoins()
    });
    this.updateSeriesProgress();
  },

  /**
   * 更新扭蛋系列解锁进度
   */
  updateSeriesProgress() {
    // 简化版本，只保留基本的系列信息
    this.setData({
      seriesList: gashaponData,
    });
  },

  // ... (onBack, onInventory, onRedeem, onSelectSeries 方法保持不变)
  onBack() {
    wx.navigateBack();
  },

  onInventory() {
    wx.navigateTo({
      url: '/pages/gashapon-inventory/gashapon-inventory'
    });
  },

  /**
   * 调试功能：综合调试面板
   * 提供清除数据、兑换金币、查看数据等调试功能
   */
  onDebugClear() {
    wx.showActionSheet({
      itemList: ['兑换500金币', '兑换1000金币', '清除已抽奖品', '重置所有数据', '查看当前数据'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 兑换500金币
          const amount = 500;
          coinManager.addCoins(amount);
          this.setData({
            userCoins: coinManager.getCoins()
          });
          wx.showToast({
            title: `成功兑换 ${amount} 金币!`,
            icon: 'success'
          });
        } else if (res.tapIndex === 1) {
          // 兑换1000金币
          const amount = 1000;
          coinManager.addCoins(amount);
          this.setData({
            userCoins: coinManager.getCoins()
          });
          wx.showToast({
            title: `成功兑换 ${amount} 金币!`,
            icon: 'success'
          });
        } else if (res.tapIndex === 2) {
          // 清除已解锁的奖品
          wx.showModal({
            title: '确认清除',
            content: '确定要清除所有已抽到的奖品吗？金币数量不会改变。',
            success: (modalRes) => {
              if (modalRes.confirm) {
                coinManager.clearUnlockedPrizes();
                this.updateSeriesProgress(); // 更新页面显示
                wx.showToast({
                  title: '已清除奖品数据',
                  icon: 'success'
                });
              }
            }
          });
        } else if (res.tapIndex === 3) {
          // 重置所有数据
          wx.showModal({
            title: '确认重置',
            content: '确定要重置所有数据吗？包括金币和奖品都会恢复到初始状态。',
            success: (modalRes) => {
              if (modalRes.confirm) {
                coinManager.resetUserData();
                this.setData({
                  userCoins: coinManager.getCoins()
                });
                this.updateSeriesProgress(); // 更新页面显示
                wx.showToast({
                  title: '已重置所有数据',
                  icon: 'success'
                });
              }
            }
          });
        } else if (res.tapIndex === 4) {
          // 查看当前数据
          const unlockedPrizes = coinManager.getUnlockedPrizes();
          const currentCoins = coinManager.getCoins();
          wx.showModal({
            title: '当前数据',
            content: `金币: ${currentCoins}\n已解锁奖品: ${unlockedPrizes.length}个\n奖品ID: ${unlockedPrizes.join(', ') || '无'}`,
            showCancel: false,
            confirmText: '知道了'
          });
        }
      }
    });
  },

  /**
   * swiper滑动切换事件处理
   * 当用户滑动swiper时，同步更新tag状态和系列ID
   */
  onSwiperChange(e) {
    const currentIndex = e.detail.current;
    // 调换后的映射：索引0对应系列2（美味补给），索引1对应系列1（梦幻魔法）
    const targetSeriesId = currentIndex === 0 ? 2 : 1;
    const currentSeries = gashaponData.find(series => series.id === targetSeriesId);
    
    // 根据系列ID切换背景图片
    const machineImageUrl = targetSeriesId === 2 
      ? 'https://free.picui.cn/free/2025/07/26/6883c5e4b8633.jpg' // 美味补给
      : 'https://free.picui.cn/free/2025/07/26/6883c5e48d352.jpg'; // 梦幻魔法
    
    this.setData({
      swiperIndex: currentIndex,
      currentSeriesId: targetSeriesId,
      drawCost: currentSeries ? currentSeries.cost : 0, // 动态获取当前系列的消耗
      machineImageUrl: machineImageUrl, // 更新背景图片
    });
  },

  /**
   * 点击tag切换事件处理
   * 当用户点击tag时，同步更新swiper位置
   */
  onSelectSeries(e) {
    const selectedId = parseInt(e.currentTarget.dataset.id);
    // 调换后的映射：系列2对应索引0，系列1对应索引1
    const targetIndex = selectedId === 2 ? 0 : 1;
    const currentSeries = gashaponData.find(series => series.id === selectedId);
    
    // 根据系列ID切换背景图片
    const machineImageUrl = selectedId === 2 
      ? 'https://free.picui.cn/free/2025/07/26/6883c5e4b8633.jpg' // 美味补给
      : 'https://free.picui.cn/free/2025/07/26/6883c5e48d352.jpg'; // 梦幻魔法
    
    this.setData({
      swiperIndex: targetIndex,
      currentSeriesId: selectedId,
      drawCost: currentSeries ? currentSeries.cost : 0, // 动态获取当前系列的消耗
      machineImageUrl: machineImageUrl, // 更新背景图片
    });
  },

  // 单次抽奖 (已重构 - 支持防重复和奖池检查) ✨
  onDraw() {
    console.log('--- 开始抽奖流程 ---');
    const currentSeries = gashaponData.find(series => series.id === this.data.currentSeriesId);
    if (!currentSeries) {
      console.error('错误：找不到对应的奖池！');
      return; 
    }
    
    // 检查当前系列是否已经集齐所有奖品
    if (isSeriesCompleted(currentSeries.prizes)) {
      wx.showModal({
        title: '恭喜！🎉',
        content: `${currentSeries.name}系列的所有奖品已经集齐啦！快去试试其他系列吧～`,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#ff6b9d'
      });
      return;
    }
    
    const currentCost = currentSeries.cost; // 使用当前系列的实际消耗
    console.log(`本次消耗: ${currentCost}`);

    // 使用 coinManager.spendCoins() 来检查并扣除金币
    if (!coinManager.spendCoins(currentCost)) {
      wx.showModal({
        title: '金币不足',
        content: `抽奖需要 ${currentCost} 金币，当前金币: ${coinManager.getCoins()}`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    // 更新页面显示的金币数量
    this.setData({
      userCoins: coinManager.getCoins()
    });

    // 执行抽奖逻辑
    const result = drawPrize(currentSeries.prizes);
    console.log('抽奖结果:', result);

    if (result.success) {
      // 跳转到结果页面
      wx.navigateTo({
        url: `/pages/gashapon-result/gashapon-result?prizeId=${result.prize.id}&seriesId=${this.data.currentSeriesId}`
      });
    } else {
      wx.showToast({
        title: result.message || '抽奖失败',
        icon: 'none'
      });
    }
  }
});