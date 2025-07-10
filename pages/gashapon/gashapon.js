// 引入扭蛋机数据和抽奖辅助函数
const { gashaponData } = require('./gashapon-prizes.js');
const { drawPrize } = require('../../utils/gashapon-helper.js');

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
    // 用户金币数量
    userCoins: 1200, 
    // 扭蛋系列列表（将从 gashaponData 动态加载）
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
    // 获取系统信息，用于计算自定义导航栏的高度
    const systemInfo = wx.getSystemInfoSync();
    // 获取胶囊按钮的位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

    // 从 gashaponData 加载系列信息，同时保留UI所需的字段
    const seriesList = gashaponData.map(series => ({
      id: series.id,
      name: series.name,
      cost: series.cost,
      image: series.image,
      gradientType: series.gradientType
    }));
    
    // 根据默认的 currentSeriesId 找到当前系列
    const currentSeries = gashaponData.find(series => series.id === this.data.currentSeriesId);

    this.setData({
      // 状态栏高度
      statusBarHeight: systemInfo.statusBarHeight,
      // 导航栏高度 = 胶囊按钮高度 + (胶囊按钮上边界 - 状态栏高度) * 2
      navBarHeight: menuButtonInfo.height + (menuButtonInfo.top - systemInfo.statusBarHeight) * 2,
      // 胶囊按钮顶部距离, 设置为胶囊按钮底部 + 8px的间距
      menuButtonTop: menuButtonInfo.bottom + 8,
      // 设置系列列表
      seriesList: seriesList,
      // 设置初始抽奖消耗
      drawCost: currentSeries ? currentSeries.cost : 0,
    });
  },

  /**
   * 用户点击返回按钮
   */
  onBack() {
    wx.navigateBack();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 跳转到库存页面
  onInventory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 跳转到兑换码页面
  onRedeem() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 选择扭蛋系列
  onSelectSeries(e) {
    const selectedId = e.currentTarget.dataset.id;
    // 从 gashaponData 中查找选中的系列
    const selectedSeries = gashaponData.find(item => item.id === selectedId);
    if (selectedSeries) {
      this.setData({
        currentSeriesId: selectedId,
        drawCost: selectedSeries.cost,
      });
    }
  },

  // 单次抽奖
  onDraw() {
    console.log('--- 开始抽奖流程 ---');
    console.log(`当前金币: ${this.data.userCoins}, 本次消耗: ${this.data.drawCost}`);

    if (this.data.userCoins < this.data.drawCost) {
      console.log('金币不足，中断抽奖');
      wx.showToast({
        title: '金币不足',
        icon: 'none'
      });
      return;
    }

    console.log('金币充足，准备扣除...');
    // 扣除金币
    this.setData({
      userCoins: this.data.userCoins - this.data.drawCost
    });
    console.log(`金币扣除完毕，剩余金币: ${this.data.userCoins}`);

    // 根据当前系列ID从 gashaponData 获取对应的奖池
    console.log(`正在为系列ID ${this.data.currentSeriesId} 查找奖池...`);
    const currentSeries = gashaponData.find(series => series.id === this.data.currentSeriesId);
    
    if (!currentSeries) {
      console.error('错误：找不到对应的奖池！');
      return; 
    }
    console.log('成功找到奖池，准备抽奖...');
    
    // 抽奖
    const result = drawPrize(currentSeries.prizes);
    console.log('抽奖成功！获得奖品:', result);

    // 将抽奖结果对象转换为JSON字符串，并进行URI编码
    const prizeData = encodeURIComponent(JSON.stringify(result));
    console.log('奖品数据已打包，准备跳转...');

    // 跳转到抽奖结果页面，并携带奖品数据和奖池ID
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



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})