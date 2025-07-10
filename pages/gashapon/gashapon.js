// 引入扭蛋机数据和抽奖辅助函数
const { gashaponData } = require('./gashapon-prizes.js');
const { drawPrize } = require('../../utils/gashapon-helper.js');
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
    // 当前选中的扭蛋系列ID
    currentSeriesId: 1,
    // 当前抽奖的消耗
    drawCost: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // ... (onLoad 中其他代码保持不变)
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const seriesList = gashaponData.map(series => ({
      id: series.id,
      name: series.name,
      cost: series.cost,
      image: series.image,
      gradientType: series.gradientType
    }));
    const currentSeries = gashaponData.find(series => series.id === this.data.currentSeriesId);

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navBarHeight: menuButtonInfo.height + (menuButtonInfo.top - systemInfo.statusBarHeight) * 2,
      menuButtonTop: menuButtonInfo.bottom + 8,
      seriesList: seriesList,
      drawCost: currentSeries ? currentSeries.cost : 0,
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时，都从 coinManager 更新金币数量
    this.setData({
      userCoins: coinManager.getCoins()
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

  onRedeem() {
    const amount = 500;
    coinManager.addCoins(amount);
    this.setData({
      userCoins: coinManager.getCoins()
    });
    wx.showToast({
      title: `成功兑换 ${amount} 金币!`,
      icon: 'success'
    });
  },

  onSelectSeries(e) {
    const selectedId = e.currentTarget.dataset.id;
    const selectedSeries = gashaponData.find(item => item.id === selectedId);
    if (selectedSeries) {
      this.setData({
        currentSeriesId: selectedId,
        drawCost: selectedSeries.cost,
      });
    }
  },

  // 单次抽奖 (已重构)
  onDraw() {
    console.log('--- 开始抽奖流程 ---');
    const currentCost = this.data.drawCost;
    console.log(`本次消耗: ${currentCost}`);

    // 使用 coinManager.spendCoins() 来检查并扣除金币
    if (!coinManager.spendCoins(currentCost)) {
      console.log('金币不足，中断抽奖');
      wx.showToast({
        title: '金币不足',
        icon: 'none'
      });
      return;
    }

    console.log('金币扣除成功！');
    // 成功扣除后，更新页面显示的金币数量
    this.setData({
      userCoins: coinManager.getCoins()
    });

    // ... (后续抽奖逻辑保持不变)
    const currentSeries = gashaponData.find(series => series.id === this.data.currentSeriesId);
    if (!currentSeries) {
      console.error('错误：找不到对应的奖池！');
      return; 
    }
    console.log('成功找到奖池，准备抽奖...');
    
    const result = drawPrize(currentSeries.prizes);
    console.log('抽奖成功！获得奖品:', result);

    // 将新获得的奖品ID添加到用户数据中
    coinManager.addUnlockedPrize(result.id);

    const prizeData = encodeURIComponent(JSON.stringify(result));
    console.log('奖品数据已打包，准备跳转...');

    wx.navigateTo({
      url: `/pages/gashapon-result/gashapon-result?prizeData=${prizeData}&poolId=${this.data.currentSeriesId}`,
      success: function(res) {
        console.log('页面跳转成功！', res);
      },
      fail: function(err) {
        console.error('页面跳转失败！', err);
      }
    });
  },

  // ... (其他生命周期函数保持不变)
});