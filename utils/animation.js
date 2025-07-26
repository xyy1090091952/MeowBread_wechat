// utils/animation.js

/**
 * 首页掉落物动画和碰撞检测的辅助模块
 * @param {Page} page - Page实例，用于调用setData和createSelectorQuery
 */
function AnimationHelper(page) {
  this.page = page;
  this.collisionTimer = null;
  this.autoBounceTimer = null; // Timer for auto bounce

  // 初始化动画所需的数据
  this.page.setData({
    elementPositions: [],
    breadBouncing: false,
  });
}

/**
 * 设置动画监听器
 */
AnimationHelper.prototype.setupAnimationListeners = function() {
  // 开始碰撞检测
  this.startCollisionDetection();
  
  // 延迟设置监听器，确保动画已开始
  setTimeout(() => {
    for (let i = 1; i <= 5; i++) {
      // 模拟动画结束事件，因为无法直接监听CSS动画
      const elementInfo = this.page.data.elementPositions.find(pos => pos.id === i);
      if (elementInfo) {
        const totalTime = (elementInfo.delay + elementInfo.duration) * 1000; // 转换到毫秒
        setTimeout(() => {
          const positions = this.page.data.elementPositions;
          const updatedPositions = positions.map(pos => 
            pos.id === i ? { ...pos, settled: true } : pos
          );
          this.page.setData({ elementPositions: updatedPositions });
          console.log(`元素 ${i} 动画完成，已静止`);
        }, totalTime);
      }
    }
  }, 100);
};

/**
 * 开始碰撞检测
 */
AnimationHelper.prototype.startCollisionDetection = function() {
  // 每隔100ms检测一次碰撞
  this.collisionTimer = setInterval(() => {
    this.checkAndResolveCollisions();
  }, 100);
  
  // 4秒后停止碰撞检测（匹配中等动画速度）
  setTimeout(() => {
    if (this.collisionTimer) {
      clearInterval(this.collisionTimer);
      this.collisionTimer = null;
      console.log('碰撞检测已停止');
    }
  }, 4000);
};

/**
 * 检测和解决碰撞
 */
AnimationHelper.prototype.checkAndResolveCollisions = function() {
  const query = wx.createSelectorQuery().in(this.page);
  
  // 获取所有元素的当前位置
  for (let i = 1; i <= 5; i++) {
    query.select(`#falling-item-${i}`).boundingClientRect();
  }
  
  query.exec((res) => {
    if (!res || res.length < 5 || !res.every(r => r)) return;
    
    // 检测每对元素之间的碰撞
    for (let i = 0; i < res.length; i++) {
      for (let j = i + 1; j < res.length; j++) {
        const element1 = res[i];
        const element2 = res[j];
        
        if (element1 && element2 && this.isColliding(element1, element2)) {
          console.log(`检测到碰撞：元素${i+1} 和 元素${j+1}`);
          this.resolveCollision(i + 1, j + 1, element1, element2);
        }
      }
    }
  });
};

/**
 * 检测两个元素是否碰撞
 */
AnimationHelper.prototype.isColliding = function(element1, element2) {
  if (!element1 || !element2) return false;
  
  const iconSize = 230; // 230rpx图标大小
  const pixelRatio = wx.getWindowInfo().pixelRatio || 2;
  const iconSizePx = iconSize / pixelRatio; // 转换为px
  
  // 计算中心点距离
  const centerX1 = element1.left + element1.width / 2;
  const centerY1 = element1.top + element1.height / 2;
  const centerX2 = element2.left + element2.width / 2;
  const centerY2 = element2.top + element2.height / 2;
  
  const distance = Math.sqrt(
    Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
  );
  
  // 如果距离小于图标直径的80%，认为发生碰撞
  return distance < iconSizePx * 0.8;
};

/**
 * 解决碰撞
 */
AnimationHelper.prototype.resolveCollision = function(id1, id2, element1, element2) {
  const elementInfo1 = this.page.data.elementPositions.find(pos => pos.id === id1);
  const elementInfo2 = this.page.data.elementPositions.find(pos => pos.id === id2);
  
  if (!elementInfo1 || !elementInfo2) return;
  
  // 计算推开的方向和距离
  const centerX1 = element1.left + element1.width / 2;
  const centerX2 = element2.left + element2.width / 2;
  
  // 水平推开距离
  const pushDistance = 20; // px
  
  // 确定推开方向
  let newLeft1 = elementInfo1.left;
  let newLeft2 = elementInfo2.left;
  
  if (centerX1 < centerX2) {
    // 元素1在左侧，向左推开元素1，向右推开元素2
    newLeft1 = Math.max(5, elementInfo1.left - 3); // 最小5%
    newLeft2 = Math.min(85, elementInfo2.left + 3); // 最大85%
  } else {
    // 元素1在右侧，向右推开元素1，向左推开元素2
    newLeft1 = Math.min(85, elementInfo1.left + 3);
    newLeft2 = Math.max(5, elementInfo2.left - 3);
  }
  
  // 更新元素位置
  const updatedPositions = this.page.data.elementPositions.map(pos => {
    if (pos.id === id1) return { ...pos, left: newLeft1 };
    if (pos.id === id2) return { ...pos, left: newLeft2 };
    return pos;
  });
  
  this.page.setData({ elementPositions: updatedPositions });
  
  // 更新样式
  const updateStyles = {};
  updateStyles[`fallingStyle${id1}`] = `left: ${newLeft1}%; animation-delay: ${elementInfo1.delay.toFixed(1)}s; animation-duration: ${elementInfo1.duration.toFixed(1)}s; transform: translateX(-50%);`;
  updateStyles[`fallingStyle${id2}`] = `left: ${newLeft2}%; animation-delay: ${elementInfo2.delay.toFixed(1)}s; animation-duration: ${elementInfo2.duration.toFixed(1)}s; transform: translateX(-50%);`;
  
  this.page.setData(updateStyles);
  
  console.log(`碰撞解决：元素${id1}移动到${newLeft1.toFixed(1)}%，元素${id2}移动到${newLeft2.toFixed(1)}%`);
};

/**
 * 检查位置是否与已有位置冲突
 */
AnimationHelper.prototype.checkPositionCollision = function(newPosition, usedPositions, minDistance = 18) {
  return usedPositions.some(pos => Math.abs(pos - newPosition) < minDistance);
};

/**
 * 处理元素触摸事件
 */
AnimationHelper.prototype.handleElementTouch = function(e) {
  const elementId = e.currentTarget.dataset.id;
  console.log(`触摸了元素 ${elementId}`);
  
  // 直接操作元素样式实现弹跳效果
  const query = wx.createSelectorQuery().in(this.page);
  query.select(`#falling-item-${elementId}`).node((res) => {
    if (res && res.node) {
      const element = res.node;
      
      // 保存原始的margin-top值
      const originalMarginTop = element.style.marginTop || '0px';
      
      // 设置向上弹跳
      element.style.marginTop = '-30px';
      
      // 150ms后开始回弹
      setTimeout(() => {
        element.style.marginTop = '-5px';
      }, 150);
      
      // 300ms后回到原位
      setTimeout(() => {
        element.style.marginTop = originalMarginTop;
      }, 300);
    }
  });
  query.exec();
  
  // 添加触觉反馈
  wx.vibrateShort({
    type: 'light' // 轻微震动
  });
};

/**
 * 启动面包自动弹跳效果
 */
AnimationHelper.prototype.startAutoBounce = function() {
  const scheduleNextBounce = () => {
    // 随机间隔时间：8-15秒
    const randomDelay = Math.random() * 7000 + 8000; // 8000-15000ms
    
    this.autoBounceTimer = setTimeout(() => {
      // 如果页面还在显示且没有手动点击动画，则触发自动弹跳
      if (!this.page.data.breadBouncing) {
        console.log('Auto bounce triggered');
        this.page.setData({
          breadBouncing: true
        });
        
        // 动画播放完成后重置状态
        setTimeout(() => {
          this.page.setData({
            breadBouncing: false
          });
        }, 800);
      }
      
      // 安排下一次自动弹跳
      scheduleNextBounce();
    }, randomDelay);
  };
  
  // 启动第一次自动弹跳
  scheduleNextBounce();
};

/**
 * 停止面包自动弹跳
 */
AnimationHelper.prototype.stopAutoBounce = function() {
  if (this.autoBounceTimer) {
    clearTimeout(this.autoBounceTimer);
    this.autoBounceTimer = null;
  }
};

/**
 * 手动触发面包弹跳（用于点击事件）
 */
AnimationHelper.prototype.triggerManualBounce = function() {
  console.log('Bread tap triggered');
  // 如果动画正在进行中，则不重复触发
  if (this.page.data.breadBouncing) {
    return;
  }
  
  // 触发弹跳动画
  this.page.setData({
    breadBouncing: true
  });
  
  // 动画播放完成后重置状态（动画持续0.8秒）
  setTimeout(() => {
    this.page.setData({
      breadBouncing: false
    });
  }, 800);
  
  // 添加点击反馈
  wx.vibrateShort({
    type: 'light' // 轻微震动反馈
  });
};

/**
 * 销毁动画助手，清理所有定时器
 */
AnimationHelper.prototype.destroy = function() {
  console.log('销毁 AnimationHelper，清理所有定时器');
  // 停止碰撞检测
  if (this.collisionTimer) {
    clearInterval(this.collisionTimer);
    this.collisionTimer = null;
  }
  // 停止自动弹跳
  this.stopAutoBounce();
};

/**
 * 粒子效果辅助模块
 * @param {Page} page - Page实例，用于调用setData
 */
function ParticleHelper(page) {
  this.page = page;
  this.particleRefreshTimer = null;

  this.page.setData({
    showParticles: false,
    particleConfig: null,
  });
}

/**
 * 初始化粒子效果
 */
ParticleHelper.prototype.init = function() {
  try {
    // 检查并停止旧的定时器
    if (this.particleRefreshTimer) {
      clearTimeout(this.particleRefreshTimer);
      this.particleRefreshTimer = null;
    }

    // 从本地存储中获取当前选择的粒子效果ID
    const currentParticleId = wx.getStorageSync('currentParticleId') || 'FX-DEFAULT-01';
    console.log('✨ 当前选中的粒子效果ID:', currentParticleId);

    // 获取粒子效果的配置
    const particleConfig = this.getParticleConfig(currentParticleId);

    if (particleConfig) {
      // 如果有配置，则显示粒子效果
      this.page.setData({
        particleConfig: particleConfig,
        showParticles: true
      });
      // 启动粒子刷新
      this.startParticleRefresh(currentParticleId);
      console.log('✅ 粒子效果初始化成功:', currentParticleId);
    } else {
      // 如果没有配置（例如，选择了无效果的奖品），则隐藏粒子效果
      this.page.setData({
        showParticles: false,
        particleConfig: null
      });
      console.log('🚫 无需显示粒子效果或未找到配置:', currentParticleId);
    }
  } catch (error) {
    console.error('❌ 初始化粒子效果失败:', error);
    this.page.setData({ showParticles: false });
  }
};

/**
 * 启动粒子动态刷新
 */
ParticleHelper.prototype.startParticleRefresh = function(particleId) {
   // 清除之前的定时器
   if (this.particleRefreshTimer) {
     clearTimeout(this.particleRefreshTimer);
   }
  
  // 每3-8秒随机刷新一次粒子配置
  const refreshParticles = () => {
    // 检查页面是否还在显示状态，只有当前页面可见时才刷新粒子
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const isCurrentPageAnswer = currentPage && currentPage.route === 'pages/answer/answer';
    
    if (isCurrentPageAnswer && this.page.data.showParticles) {
      const newConfig = this.getParticleConfig(particleId);
      
      // 增加一个保护，防止 newConfig 为 null
      if (newConfig) {
        this.page.setData({ particleConfig: newConfig });
        console.log('🔄 粒子配置已刷新，新数量:', newConfig.count);
      } else {
        console.warn(`⚠️ 无法获取 particleId 为 "${particleId}" 的配置`);
      }
      
      // 设置下一次刷新的随机时间间隔（3-8秒）
      const nextInterval = Math.floor(Math.random() * 5000) + 3000;
      this.particleRefreshTimer = setTimeout(refreshParticles, nextInterval);
    } else {
      console.log('⏸️ 当前页面不是answer页面，停止粒子刷新');
      // 如果不是answer页面，清除定时器
      if (this.particleRefreshTimer) {
        clearTimeout(this.particleRefreshTimer);
        this.particleRefreshTimer = null;
      }
    }
  };
  
  // 首次延迟2-5秒后开始
  const initialDelay = Math.floor(Math.random() * 3000) + 2000;
  this.particleRefreshTimer = setTimeout(refreshParticles, initialDelay);
};

/**
 * 根据粒子ID获取粒子配置
 */
ParticleHelper.prototype.getParticleConfig = function(particleId) {
  if (!particleId) {
    console.warn('⚠️ getParticleConfig: particleId is null or undefined, returning default snow effect.');
    // 默认返回雪花效果的配置
    const randomCount = Math.floor(Math.random() * 6) + 17;
    return {
      type: 'snow',
      image: '/images/particles/snow.svg',
      count: randomCount,
      duration: 18,
      size: 35
    };
  }

  // 引入奖品数据管理器
  const { PrizeDataManager } = require('../data/gashapon-prizes-config.js');
  
  // 根据ID获取奖品数据
  const prizeData = PrizeDataManager.getPrizeById(particleId);
  
  // 检查奖品数据和粒子配置是否存在
  if (!prizeData || !prizeData.particleConfig) {
    console.warn(`⚠️ 未找到ID为 "${particleId}" 的奖品或该奖品没有粒子配置。`);
    return null;
  }
  
  const baseConfig = prizeData.particleConfig;
  
  // 随机变化粒子数量：基础数量 ± 15%
  const variation = Math.floor(baseConfig.baseCount * 0.15);
  const randomCount = Math.floor(Math.random() * (variation * 2 + 1)) + (baseConfig.baseCount - variation);
  
  // 返回最终的、包含随机数量的配置
  return {
    type: baseConfig.type,
    image: baseConfig.image,
    count: Math.max(5, randomCount), // 确保最少有5个粒子
    duration: baseConfig.duration,
    size: baseConfig.size
  };
};

/**
 * 销毁粒子效果，清理定时器
 */
ParticleHelper.prototype.destroy = function() {
  console.log('销毁 ParticleHelper，清理定时器');
  if (this.particleRefreshTimer) {
    clearTimeout(this.particleRefreshTimer);
    this.particleRefreshTimer = null;
  }
};


module.exports = {
  AnimationHelper,
  ParticleHelper
};