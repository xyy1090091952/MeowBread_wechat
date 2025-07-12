// pages/answer/answer.js
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器
const filterManager = require('../../utils/filterManager.js'); // 引入筛选管理器

Page({
  data: {
    // 根据Figma设计稿，一级页面主要是选项，不直接展示题目信息
    currentFilterDisplay: '', // 用于显示当前题库筛选范围
    showTextbookSelector: false, // 控制教材选择弹窗的显示
    pageLoaded: false, // 控制页面渐显动画
    mistakeCount: 0, // 错题数量显示（超过99显示∞）
    // 元素位置信息（用于碰撞检测）
    elementPositions: [],
    breadBouncing: false, // 控制面包弹跳动画状态
    autoBounceTimer: null // 自动弹跳定时器
  },
  onLoad: function (options) {
    // 页面加载时可以进行一些初始化操作
    console.log('Page loaded with options:', options);

    // 检查是否已选择教材
    const selectedDict = wx.getStorageSync('selectedDictionary');
    if (!selectedDict) {
      this.setData({ showTextbookSelector: true });
    }

    // 启动自动弹跳效果
    this.startAutoBounce();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Page ready');
    // 页面渲染完成后，启动渐显动画
    setTimeout(() => {
      this.setData({ pageLoaded: true });
    }, 100); // 延迟100ms开始动画，确保页面完全渲染
  },

  /**
   * 设置动画监听器
   */
  setupAnimationListeners() {
    // 开始碰撞检测
    this.startCollisionDetection();
    
    // 延迟设置监听器，确保动画已开始
    setTimeout(() => {
      for (let i = 1; i <= 5; i++) {
        // 模拟动画结束事件，因为无法直接监听CSS动画
        const elementInfo = this.data.elementPositions.find(pos => pos.id === i);
        if (elementInfo) {
          const totalTime = (elementInfo.delay + elementInfo.duration) * 1000; // 转换到毫秒
          setTimeout(() => {
            const positions = this.data.elementPositions;
            const updatedPositions = positions.map(pos => 
              pos.id === i ? { ...pos, settled: true } : pos
            );
            this.setData({ elementPositions: updatedPositions });
            console.log(`元素 ${i} 动画完成，已静止`);
          }, totalTime);
        }
      }
    }, 100);
  },

  /**
   * 开始碰撞检测
   */
  startCollisionDetection() {
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
  },

  /**
   * 检测和解决碰撞
   */
  checkAndResolveCollisions() {
    const query = wx.createSelectorQuery().in(this);
    const positions = [];
    
    // 获取所有元素的当前位置
    for (let i = 1; i <= 5; i++) {
      query.select(`#falling-item-${i}`).boundingClientRect();
    }
    
    query.exec((res) => {
      if (!res || res.length !== 5) return;
      
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
  },

  /**
   * 检测两个元素是否碰撞
   */
  isColliding(element1, element2) {
    if (!element1 || !element2) return false;
    
    const iconSize = 230; // 230rpx图标大小
    const pixelRatio = wx.getSystemInfoSync().pixelRatio || 2;
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
  },

  /**
   * 解决碰撞
   */
  resolveCollision(id1, id2, element1, element2) {
    const elementInfo1 = this.data.elementPositions.find(pos => pos.id === id1);
    const elementInfo2 = this.data.elementPositions.find(pos => pos.id === id2);
    
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
    const updatedPositions = this.data.elementPositions.map(pos => {
      if (pos.id === id1) return { ...pos, left: newLeft1 };
      if (pos.id === id2) return { ...pos, left: newLeft2 };
      return pos;
    });
    
    this.setData({ elementPositions: updatedPositions });
    
    // 更新样式
    const updateStyles = {};
    updateStyles[`fallingStyle${id1}`] = `left: ${newLeft1}%; animation-delay: ${elementInfo1.delay.toFixed(1)}s; animation-duration: ${elementInfo1.duration.toFixed(1)}s; transform: translateX(-50%);`;
    updateStyles[`fallingStyle${id2}`] = `left: ${newLeft2}%; animation-delay: ${elementInfo2.delay.toFixed(1)}s; animation-duration: ${elementInfo2.duration.toFixed(1)}s; transform: translateX(-50%);`;
    
    this.setData(updateStyles);
    
    console.log(`碰撞解决：元素${id1}移动到${newLeft1.toFixed(1)}%，元素${id2}移动到${newLeft2.toFixed(1)}%`);
  },

  /**
   * 检查位置是否与已有位置冲突
   */
  checkPositionCollision(newPosition, usedPositions, minDistance = 18) {
    return usedPositions.some(pos => Math.abs(pos - newPosition) < minDistance);
  },

  /**
   * 处理元素触摸事件
   */
  handleElementTouch(e) {
    const elementId = e.currentTarget.dataset.id;
    console.log(`触摸了元素 ${elementId}`);
    
    // 直接操作元素样式实现弹跳效果
    const query = wx.createSelectorQuery().in(this);
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
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('Page show');
    
    // 获取用户在filter页面的真实选择（不包括临时的course模式选择）
    let userFilter = filterManager.getFilter();
    let currentFilterDisplay = '请选择教材和课程'; // 默认提示

    // 如果当前筛选是course模式（来自course-mode页面的临时选择），则尝试恢复用户的原始选择
    if (userFilter && userFilter.quizMode === 'course') {
      const originalFilter = wx.getStorageSync('originalUserFilter');
      if (originalFilter) {
        // 恢复用户的原始筛选条件
        filterManager.saveFilter(originalFilter);
        userFilter = originalFilter;
        console.log('恢复用户原始筛选条件:', originalFilter);
        // 清除临时保存的原始选择
        wx.removeStorageSync('originalUserFilter');
      }
    }

    // 显示用户的筛选选择
    if (userFilter && userFilter.selectedDictionaryName && userFilter.selectedLessonName) {
      currentFilterDisplay = `当前：${userFilter.selectedDictionaryName} - ${userFilter.selectedLessonName}`;
    } else {
      // 如果没有筛选条件，检查是否有旧的selectedDictionary
      const selectedDictId = wx.getStorageSync('selectedDictionary');
      if (selectedDictId) {
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const selectedDict = dictionaries.find(d => d.id === selectedDictId);
        if (selectedDict) {
          currentFilterDisplay = `当前：${selectedDict.name} - 全部课程`;
        }
      }
    }

    // 获取错题数量
    const mistakeCount = mistakeManager.getMistakeList().length;
    // 当错题数量超过99时显示∞符号
    const mistakeCountDisplay = mistakeCount > 99 ? '∞' : mistakeCount;

    this.setData({
      currentFilterDisplay: currentFilterDisplay,
      mistakeCount: mistakeCountDisplay // 更新错题数量显示
    });

    // 更新自定义底部导航的选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const page = getCurrentPages().pop();
      const route = page.route;
      const tabList = this.getTabBar().data.tabList;
      const index = tabList.findIndex(item => item.pagePath === route);
      if (index !== -1) {
        this.getTabBar().updateSelected(index);
      }
    }
  },

  /** 关闭教材选择弹窗 */
  onCloseSelector() {
    this.setData({ showTextbookSelector: false });
    const selectedDictId = wx.getStorageSync('selectedDictionary');
    // 如果用户关闭弹窗时，仍然没有任何已选教材，则设置一个默认值
    if (!selectedDictId) {
      const defaultDictionaryId = 'everyones_japanese';
      const allDictionaries = require('../../database/dictionaries.js').dictionaries;
      const defaultDictionary = allDictionaries.find(d => d.id === defaultDictionaryId);

      if (defaultDictionary) {
        // 构建一个与 filter 页面保存的结构一致的筛选条件对象
        const defaultFilter = {
          selectedDictionaryIndex: allDictionaries.findIndex(d => d.id === defaultDictionaryId) + 1, // +1因为有'全部辞典'
          selectedLessonFiles: [`DICTIONARY_${defaultDictionary.id}_ALL_LESSONS`],
          selectedLessonName: '全部课程',
          selectedDictionaryName: defaultDictionary.name,
          dictionaryId: defaultDictionary.id,
          basePath: defaultDictionary.base_path || '',
          selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
        };

        // 使用filterManager保存筛选条件
        filterManager.saveFilter(defaultFilter);
        wx.setStorageSync('selectedDictionary', defaultDictionary.id);

        // 更新UI显示
        this.setData({
          currentFilterDisplay: `当前：${defaultDictionary.name} - 全部课程`
        });

        wx.showToast({
          title: '已为您选择默认教材',
          icon: 'none',
          duration: 1500
        });
      }
    }
  },

  /** 处理教材选择 */
  onSelectTextbook(e) {
    const { selectedDictionary } = e.detail; // 从事件中获取完整的词典对象
    if (!selectedDictionary || !selectedDictionary.id) {
      console.error('onSelectTextbook: 无效的 selectedDictionary');
      this.setData({ showTextbookSelector: false });
      return;
    }

    // 加载所有词典以找到索引
    const allDictionaries = require('../../database/dictionaries.js').dictionaries;
    const dictionariesWithAllOption = [{ id: 'all', name: '全部辞典' }, ...allDictionaries];
    const dictionaryIndex = dictionariesWithAllOption.findIndex(d => d.id === selectedDictionary.id);

    // 构建一个与 filter 页面保存的结构一致的筛选条件对象
    const userFilter = {
      selectedDictionaryIndex: dictionaryIndex !== -1 ? dictionaryIndex : 0,
      selectedLessonFiles: [`DICTIONARY_${selectedDictionary.id}_ALL_LESSONS`], // 默认选择该教材的全部课程
      selectedLessonName: '全部课程',
      selectedDictionaryName: selectedDictionary.name,
      dictionaryId: selectedDictionary.id,
      basePath: selectedDictionary.base_path || '',
      // 首次选择时，使用默认的题型
      selectedQuestionTypes: ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill']
    };

    // 使用filterManager保存筛选条件
    filterManager.saveFilter(userFilter);
    // 为了兼容旧逻辑或其他地方可能的直接引用，也保存一份 selectedDictionary
    wx.setStorageSync('selectedDictionary', selectedDictionary.id);

    // 更新页面显示并关闭弹窗
    this.setData({
      showTextbookSelector: false,
      currentFilterDisplay: `当前：${selectedDictionary.name} - 全部课程`
    });

    wx.showToast({
      title: '教材已选择',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('Page hide');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('Page unload');
    
    // 清理碰撞检测定时器
    if (this.collisionTimer) {
      clearInterval(this.collisionTimer);
      this.collisionTimer = null;
    }

    // 清理自动弹跳定时器
    if (this.data.autoBounceTimer) {
      clearTimeout(this.data.autoBounceTimer);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('User pulled down');
    // 可以在这里添加下拉刷新的逻辑
    // wx.stopPullDownRefresh(); // 处理完成后停止下拉刷新动画
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('Reached bottom');
    // 可以在这里添加上拉加载更多的逻辑
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    console.log('Share app message');
    return {
      title: 'MeowBread - 一起学日语吧！',
      path: '/pages/answer/answer', // 分享路径
      imageUrl: '' // 可以自定义分享图片的路径
    };
  },

  /**
   * 跳转到题库筛选页面
   */
  navigateToFilter() {
    console.log('Navigate to Filter');
    // 跳转到筛选页面时，可以传递一个默认的答题模式，例如 'quick'
    // filter.js 的 onLoad 会接收这个 mode
    wx.navigateTo({ url: '/pages/filter/filter?mode=quick' });
  },

  /**
   * 开始快速答题
   */
  startQuickQuiz() {
    console.log('Start Quick Quiz');
    
    // 读取用户在filter页面的选择
    let userFilter = filterManager.getFilter();
    
    // 如果用户没有在filter页面设置过筛选条件，引导用户去设置
    if (!userFilter || !userFilter.selectedLessonFiles || userFilter.selectedLessonFiles.length === 0) {
      wx.showToast({
        title: '请先选择题库范围',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        this.navigateToFilter();
      }, 1500);
      return;
    }

    // 创建临时的筛选条件，添加快速模式标识
    const tempFilter = { ...userFilter, quizMode: 'quick' };
    filterManager.saveFilter(tempFilter);
    
    console.log('快速答题使用筛选条件:', tempFilter);
    wx.navigateTo({
      url: `/pages/quiz/quiz?mode=quick`
    });
  },

  /**
   * 开始无尽模式
   */
  startEndlessQuiz() {
    console.log('Start Endless Quiz');
    let userFilter = filterManager.getFilter();

    // 如果用户没有在filter页面设置过筛选条件，引导用户去设置
    if (!userFilter || !userFilter.selectedLessonFiles || userFilter.selectedLessonFiles.length === 0) {
      wx.showToast({
        title: '请先选择题库范围',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        this.navigateToFilter();
      }, 1500);
      return;
    }

    // 创建临时的筛选条件，添加无尽模式标识
    const tempFilter = { ...userFilter, quizMode: 'endless' };
    filterManager.saveFilter(tempFilter);
    
    console.log('无尽模式使用筛选条件:', tempFilter);
    wx.navigateTo({
      url: '/pages/quiz/quiz?mode=endless'
    });
  },

  /**
   * 错题重练
   */
  practiceWrongQuestions() {
    console.log('Practice Wrong Questions');
    wx.navigateTo({
      url: '/pages/mistakes/mistakes'
    });
  },

  /**
   * 开始时间线模式
   */
  startTimelineMode() {
    console.log('Start Timeline Mode');
    // 跳转到时间线页面
    wx.navigateTo({
      url: '/pages/course-mode/course-mode'
    });
  },

  /**
   * 面包点击事件 - 触发Q弹动画
   */
  onBreadTap: function() {
    console.log('Bread tap triggered');
    // 如果动画正在进行中，则不重复触发
    if (this.data.breadBouncing) {
      return;
    }
    
    // 触发弹跳动画
    this.setData({
      breadBouncing: true
    });
    
    // 动画播放完成后重置状态（动画持续0.8秒）
    setTimeout(() => {
      this.setData({
        breadBouncing: false
      });
    }, 800);
    
    // 添加点击反馈
    wx.vibrateShort({
      type: 'light' // 轻微震动反馈
    });
  },

  /**
   * 启动自动弹跳效果
   */
  startAutoBounce: function() {
    const scheduleNextBounce = () => {
      // 随机间隔时间：8-15秒
      const randomDelay = Math.random() * 7000 + 8000; // 8000-15000ms
      
      this.data.autoBounceTimer = setTimeout(() => {
        // 如果页面还在显示且没有手动点击动画，则触发自动弹跳
        if (!this.data.breadBouncing) {
          console.log('Auto bounce triggered');
          this.setData({
            breadBouncing: true
          });
          
          // 动画播放完成后重置状态
          setTimeout(() => {
            this.setData({
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
  }
})
