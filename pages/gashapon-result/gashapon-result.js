// pages/gashapon-result/gashapon-result.js
// 导入扭蛋机的所有数据
const gashaponData = require('../gashapon/gashapon-prizes.js').gashaponData;
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    prize: null, // 当前展示的奖品信息
    poolId: null, // 当前奖品所属的奖池ID
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options 页面启动参数，包含 prizeData 和 poolId
   */
  onLoad(options) {
    // 从页面参数中获取奖池ID
    if (options.poolId) {
      // 将 poolId 保存到页面数据中，方便“再抽一次”时使用
      // 使用 Number() 确保即使传来的是字符串也能转为数字
      this.setData({ poolId: Number(options.poolId) });
    }

    // 从页面参数中获取奖品信息
    if (options.prizeData) {
      // prizeData 是一个 JSON 字符串，需要解析
      const prize = JSON.parse(decodeURIComponent(options.prizeData));
      this.setData({ prize });
    } else {
      // 如果没有奖品数据，这是一个异常情况
      // 提示用户并自动返回上一页
      wx.showToast({
        title: '奖品信息丢失',
        icon: 'error',
        duration: 2000
      });
      // 2秒后自动返回
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * @description “再抽一次”按钮的点击事件
   * 1. 检查奖池信息是否存在
   * 2. 根据奖池信息获取抽奖成本，并检查用户金币是否足够
   * 3. 扣除金币
   * 4. 从当前奖池中随机抽取一个新奖品（暂不考虑权重）
   * 5. 刷新当前页面的奖品信息
   */
  onDrawAgain() {
    // 1. 检查奖池ID是否存在
    if (this.data.poolId === null) {
      wx.showToast({ title: '奖池信息丢失，无法抽奖', icon: 'none' });
      return;
    }

    // 2. 根据 poolId 找到对应的奖池配置
    const pool = gashaponData.find(p => p.id === this.data.poolId);
    if (!pool) {
      wx.showToast({ title: '奖池配置错误', icon: 'none' });
      return;
    }

    // 从奖池配置中获取抽奖成本
    const drawCost = pool.cost;
    const userCoins = app.globalData.coins;

    // 检查金币是否足够
    if (userCoins < drawCost) {
      wx.showToast({ title: '金币不足！', icon: 'none' });
      return;
    }

    // 3. 扣除金币
    app.globalData.coins -= drawCost;
    // 在实际项目中，这里应该有更可靠的数据持久化操作，例如调用后端API
    console.log(`金币已扣除，剩余: ${app.globalData.coins}`);

    // 4. 执行抽奖逻辑（简单随机）
    // 注意：当前为简单随机抽取，未实现权重。如需按权重抽奖，需在 gashapon-prizes.js 中为奖品增加 weight 字段。
    const prizes = pool.prizes;
    const newPrize = prizes[Math.floor(Math.random() * prizes.length)];

    // 5. 刷新页面数据
    if (newPrize) {
      this.setData({
        prize: newPrize
      });
      wx.showToast({
        title: '抽奖成功！',
        icon: 'success'
      });
    } else {
      // 理论上在当前简单随机逻辑下，这里不会执行
      wx.showToast({
        title: '抽奖失败，请重试',
        icon: 'none'
      });
    }
  },

  /**
   * @description “好耶”按钮的点击事件，返回上一页
   */
  onConfirm() {
    wx.navigateBack();
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