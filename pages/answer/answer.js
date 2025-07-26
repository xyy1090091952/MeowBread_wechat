// pages/answer/answer.js
const mistakeManager = require('../../utils/mistakeManager.js'); // 引入错题管理器
const filterManager = require('../../utils/filterManager.js'); // 引入筛选管理器
const quizService = require('../../utils/quiz.service.js'); // 引入答题服务

Page({
  data: {
    // 根据Figma设计稿，一级页面主要是选项，不直接展示题目信息
    currentFilterDisplay: '', // 用于显示当前题库筛选范围
    currentTextbookName: '请选择教材', // 当前选择的课本名称
    currentTextbookImage: '/images/icons/card.svg', // 当前选择的课本图片，默认使用卡片图标
    showTextbookSelector: false, // 控制教材选择弹窗的显示
    pageLoaded: false, // 控制页面渐显动画
    mistakeCount: 0, // 错题数量显示（超过99显示∞）
    // 元素位置信息（用于碰撞检测）
    elementPositions: [],
    breadBouncing: false, // 控制面包弹跳动画状态
    autoBounceTimer: null, // 自动弹跳定时器
    
    // 题型选择相关数据
    showQuestionTypePopup: false, // 控制题型选择弹窗的显示
    questionTypeOptions: [], // 题型选项列表
    selectedQuestionTypes: [], // 当前选择的题型
    
    // 词库选择相关数据
    dictionaries: [], // 词典列表
    selectedDictionaryIndex: 0, // 当前选择的词典索引
    showCourseSelector: false, // 控制课程选择弹窗的显示
    
    // 粒子效果相关数据
    currentParticleId: '', // 当前选中的粒子效果ID
    showParticles: false, // 是否显示粒子效果
    particleConfig: null, // 当前粒子配置
    particleRefreshTimer: null, // 粒子刷新定时器
    
    // 美味补给横幅图片
    bannerImage: 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png', // 默认大面包图片 ✨
  },
  onLoad: function (options) {
    // 页面加载时可以进行一些初始化操作
    console.log('Page loaded with options:', options);

    // 检查是否已选择教材
    const selectedDict = wx.getStorageSync('selectedDictionary');
    if (!selectedDict) {
      this.setData({ showTextbookSelector: true });
    }

    // 初始化题型选择数据
    this.initializeQuestionTypes();

    // 启动自动弹跳效果
    this.startAutoBounce();
    
    // 初始化粒子效果
    this.initParticleEffect();
  },

  /**
   * 初始化题型选择数据
   */
  initializeQuestionTypes() {
    const filterService = require('../../utils/filter.service.js');
    const questionTypeOptions = filterService.getDefaultQuestionTypeOptions();
    
    // 获取当前用户的选择
    const userFilter = filterManager.getFilter();
    const selectedQuestionTypes = userFilter && userFilter.selectedQuestionTypes 
      ? userFilter.selectedQuestionTypes 
      : filterService.getDefaultSelectedQuestionTypes();
    
    // 更新选项的选中状态
    const updatedOptions = questionTypeOptions.map(opt => ({
      ...opt,
      checked: selectedQuestionTypes.includes(opt.value)
    }));
    
    this.setData({
      questionTypeOptions: updatedOptions,
      selectedQuestionTypes: selectedQuestionTypes
    });
    
    console.log('题型选择数据已初始化:', { selectedQuestionTypes, updatedOptions });
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
    
    // 重新初始化粒子效果（确保粒子系统正确启动）
    this.initParticleEffect();
    
    // 获取用户在filter页面的真实选择（包括course模式的选择）
    let userFilter = filterManager.getFilter();
    let currentFilterDisplay = '请选择教材和课程'; // 默认提示
    let currentTextbookName = '请选择教材'; // 默认课本名称
    let currentTextbookImage = '/images/icons/card.svg'; // 默认课本图片

    console.log('📋 当前筛选信息:', userFilter);

    // 优先处理用户的筛选选择（包括course模式）
    if (userFilter && (userFilter.selectedDictionaryName || userFilter.dictionaryId)) {
      console.log('📋 检测到用户筛选信息:', userFilter);
      
      // 获取教材名称 - 优先使用selectedDictionaryName，如果没有则从数据库查找
      if (userFilter.selectedDictionaryName) {
        currentTextbookName = userFilter.selectedDictionaryName;
      } else if (userFilter.dictionaryId) {
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const selectedDict = dictionaries.find(d => d.id === userFilter.dictionaryId);
        currentTextbookName = selectedDict ? selectedDict.name : '未知教材';
      }
      
      // 获取教材图片 - 优先使用dictionaryId，如果没有则使用selectedDictionaryKey
      const imageId = userFilter.dictionaryId || userFilter.selectedDictionaryKey;
      if (imageId) {
        console.log('🔍 准备获取课本图片，imageId:', imageId);
        currentTextbookImage = this.getTextbookImage(imageId);
      }
      
      // 构建显示文本
      if (userFilter.selectedLessonName && userFilter.selectedLessonName !== '全部课程') {
        currentFilterDisplay = `当前：${currentTextbookName} - ${userFilter.selectedLessonName}`;
      } else {
        currentFilterDisplay = `当前：${currentTextbookName} - 全部课程`;
      }

      // 如果是course模式，确保显示具体的课程信息
      if (userFilter.quizMode === 'course' && userFilter.selectedLessonName) {
        console.log('🎯 检测到课程模式，显示具体课程信息');
        currentFilterDisplay = `当前：${currentTextbookName} - ${userFilter.selectedLessonName}`;
      }
      
      console.log('✅ 筛选信息处理完成:', {
        currentTextbookName,
        currentFilterDisplay,
        currentTextbookImage
      });
    } else {
      // 如果没有筛选条件，检查是否有旧的selectedDictionary
      const selectedDictId = wx.getStorageSync('selectedDictionary');
      console.log('🔍 从本地存储获取课本ID:', selectedDictId);
      if (selectedDictId) {
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const selectedDict = dictionaries.find(d => d.id === selectedDictId);
        console.log('📚 找到的课本信息:', selectedDict);
        if (selectedDict) {
          currentTextbookName = selectedDict.name;
          console.log('🔍 准备获取课本图片，dictionaryId:', selectedDict.id);
          currentTextbookImage = this.getTextbookImage(selectedDict.id);
          currentFilterDisplay = `当前：${selectedDict.name} - 全部课程`;
        }
      } else {
        // 如果完全没有数据，设置默认的大家的日语
        console.log('🎯 没有找到任何教材数据，设置默认教材');
        const dictionaries = require('../../database/dictionaries.js').dictionaries;
        const defaultDict = dictionaries.find(d => d.id === 'everyones_japanese') || dictionaries[0];
        if (defaultDict) {
          currentTextbookName = defaultDict.name;
          currentTextbookImage = this.getTextbookImage(defaultDict.id);
          currentFilterDisplay = `当前：${defaultDict.name} - 全部课程`;
          
          // 保存默认选择到本地存储
          wx.setStorageSync('selectedDictionary', defaultDict.id);
          console.log('💾 已保存默认教材到本地存储:', defaultDict.id);
        }
      }
    }

    // 获取错题数量
    const mistakeCount = mistakeManager.getMistakeList().length;
    // 当错题数量超过99时显示∞符号
    const mistakeCountDisplay = mistakeCount > 99 ? '∞' : mistakeCount;

    console.log('🎯 最终设置的数据:', {
      currentFilterDisplay,
      currentTextbookName,
      currentTextbookImage,
      mistakeCount: mistakeCountDisplay
    });

    this.setData({
      currentFilterDisplay: currentFilterDisplay,
      currentTextbookName: currentTextbookName,
      currentTextbookImage: currentTextbookImage,
      mistakeCount: mistakeCountDisplay // 更新错题数量显示
    });

    // 获取当前选择的美味补给奖品横幅图片 🍞✨
    this.updateBannerImage();

    // 重要的：更新自定义底部导航的选中状态，确保高亮正确
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const page = getCurrentPages().pop();
      const route = page.route;
      const tabList = this.getTabBar().data.tabList;
      const index = tabList.findIndex(item => item.pagePath === route);
      if (index !== -1) {
        this.getTabBar().updateSelected(index);
      }
    }
    
    // 初始化粒子效果
    this.initParticleEffect();
  },

  /**
   * 根据课本ID获取对应的图片路径
   */
  getTextbookImage(dictionaryId) {
    // 动态从数据库获取课本信息
    try {
      console.log('🔍 获取课本图片，dictionaryId:', dictionaryId);
      
      if (!dictionaryId) {
        console.warn('⚠️ dictionaryId 为空，使用默认的大家的日语图片');
        // 当dictionaryId为空时，返回默认的大家的日语图片，而不是通用图标
        return 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg';
      }
      
      const dictionariesData = require('../../database/dictionaries.js');
      console.log('📚 数据库加载成功，课本数量:', dictionariesData.dictionaries.length);
      
      const dictionary = dictionariesData.dictionaries.find(dict => dict.id === dictionaryId);
      console.log('🎯 找到的课本信息:', dictionary);
      
      if (dictionary && dictionary.cover_image) {
        console.log('✅ 使用数据库中的封面图片:', dictionary.cover_image);
        return dictionary.cover_image;
      }
      
      console.warn('⚠️ 数据库中没有找到图片，使用默认图片');
      // 如果数据库中没有图片字段，返回默认图片
      return 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg';
    } catch (error) {
      console.error('❌ 获取课本图片失败:', error);
      // 即使出错也返回默认的大家的日语图片
      return 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg';
    }
  },

  /**
   * 更新美味补给横幅图片 🍞✨
   * 根据陈列馆页面美味补给系列的选择，动态显示对应的横幅图片
   */
  updateBannerImage() {
    try {
      console.log('🍞 开始更新美味补给横幅图片...');
      
      // 获取当前选择的美味补给奖品ID
      const supplyParticleId = wx.getStorageSync('supplyParticleId') || 'FOOD-DEFAULT-01';
      console.log('🎯 当前选择的美味补给奖品ID:', supplyParticleId);
      
      // 引入奖品配置数据
      const { PrizeDataManager } = require('../../data/gashapon-prizes-config.js');
      
      // 查找对应的奖品配置
      const prizeData = PrizeDataManager.getPrizeById(supplyParticleId);
      
      if (prizeData) {
        console.log('🏷️ 奖品名称:', prizeData.name);
        console.log('🖼️ 奖品横幅图片:', prizeData.bannerImage);
        
        // 如果奖品有横幅图片且不为空，使用奖品的横幅图片；否则使用默认的北海道面包图片
        const bannerImageUrl = (prizeData.bannerImage && prizeData.bannerImage.trim() !== '') 
          ? prizeData.bannerImage 
          : 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png'; // 默认北海道面包图片
        
        console.log('✅ 最终使用的横幅图片:', bannerImageUrl);
        
        // 更新横幅图片
        this.setData({
          bannerImage: bannerImageUrl
        });
        
        console.log('🎉 美味补给横幅图片更新成功！');
      } else {
        console.warn('⚠️ 未找到对应的奖品配置，使用默认图片');
        // 使用默认的北海道面包图片
        this.setData({
          bannerImage: 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png'
        });
      }
    } catch (error) {
      console.error('❌ 更新美味补给横幅图片失败:', error);
      // 出错时使用默认图片
      this.setData({
        bannerImage: 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png'
      });
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
          selectedDictionaryIndex: allDictionaries.findIndex(d => d.id === defaultDictionaryId), // 直接使用词典索引
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
          currentFilterDisplay: `当前：${defaultDictionary.name} - 全部课程`,
          currentTextbookName: defaultDictionary.name,
          currentTextbookImage: this.getTextbookImage(defaultDictionary.id)
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
    const dictionaryIndex = allDictionaries.findIndex(d => d.id === selectedDictionary.id);

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
      currentFilterDisplay: `当前：${selectedDictionary.name} - 全部课程`,
      currentTextbookName: selectedDictionary.name,
      currentTextbookImage: this.getTextbookImage(selectedDictionary.id)
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
    
    // 停止粒子刷新定时器，节省内存
    if (this.data.particleRefreshTimer) {
      clearTimeout(this.data.particleRefreshTimer);
      this.setData({ particleRefreshTimer: null });
      console.log('⏸️ 页面隐藏，停止粒子刷新定时器');
    }
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

    // 清理粒子刷新定时器
    if (this.data.particleRefreshTimer) {
      clearTimeout(this.data.particleRefreshTimer);
      this.setData({ particleRefreshTimer: null });
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
   * 跳转到题库筛选页面 -> 改为显示课程选择弹窗
   */
  navigateToFilter() {
    console.log('显示课程选择弹窗');
    this.showCourseSelector();
  },

  /**
   * 显示课程选择弹窗（现在简化为词库选择）
   */
  showCourseSelector() {
    const filterService = require('../../utils/filter.service.js');
    
    // 初始化词典列表，传递默认的options参数
    const dictionaries = filterService.initializeFilterState({ mode: 'quick' }).dictionaries;
    
    // 获取当前筛选条件
    const filterManager = require('../../utils/filterManager.js');
    const currentFilter = filterManager.getFilter() || {};
    
    // 找到当前选择的词典索引
    let selectedDictionaryIndex = 0;
    if (currentFilter.dictionaryId) {
      const foundIndex = dictionaries.findIndex(dict => dict.id === currentFilter.dictionaryId);
      if (foundIndex !== -1) {
        selectedDictionaryIndex = foundIndex;
      }
    }
    
    this.setData({
      dictionaries: dictionaries,
      selectedDictionaryIndex: selectedDictionaryIndex,
      showCourseSelector: true
    });
  },

  /**
   * 正方形按钮点击事件 - 显示题型选择弹窗
   */
  onSquareButtonTap() {
    console.log('Square button tapped - 显示题型选择弹窗');
    this.showQuestionTypePopup();
  },

  /**
   * 显示题型选择弹窗
   */
  showQuestionTypePopup() {
    // 如果数据还没有初始化，先初始化
    if (!this.data.questionTypeOptions || this.data.questionTypeOptions.length === 0) {
      this.initializeQuestionTypes();
    }
    
    // 显示弹窗
    this.setData({
      showQuestionTypePopup: true
    });
  },

  /**
   * 关闭题型选择弹窗
   */
  onCloseQuestionTypePopup() {
    this.setData({ showQuestionTypePopup: false });
  },

  /**
   * 确认题型选择
   */
  onConfirmQuestionTypePopup(e) {
    const { selectedQuestionTypes, questionTypeOptions } = e.detail;
    
    // 更新当前页面数据
    this.setData({
      selectedQuestionTypes,
      questionTypeOptions,
      showQuestionTypePopup: false
    });
    
    // 保存到筛选条件中
    const userFilter = filterManager.getFilter() || {};
    const updatedFilter = {
      ...userFilter,
      selectedQuestionTypes: selectedQuestionTypes
    };
    
    filterManager.saveFilter(updatedFilter);
    
    wx.showToast({
      title: '题型已更新',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 开始快速答题
   */
  async startQuickQuiz() {
    console.log('Start Quick Quiz');
    
    let userFilter = filterManager.getFilter();
    
    if (!userFilter || !userFilter.selectedLessonFiles || userFilter.selectedLessonFiles.length === 0) {
      wx.showToast({
        title: '请先选择题库范围',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        this.showCourseSelector();
      }, 1000);
      return;
    }

    wx.showLoading({ title: '正在出题...' });

    try {
      const quizData = await quizService.initializeQuiz({ mode: 'quick' });
      wx.hideLoading();

      if (quizData.error) {
        wx.showToast({ title: quizData.error, icon: 'none' });
        return;
      }

      if (!quizData.questions || quizData.questions.length === 0) {
        wx.showToast({ title: '没有找到符合条件的题目', icon: 'none' });
        return;
      }
      
      this.navigateToQuizPage(quizData.questions, quizData.allWordsInLesson, userFilter, 'quick');
    } catch (error) {
      wx.hideLoading();
      console.error('Failed to start quick quiz:', error);
      wx.showToast({ title: '出题失败，请稍后重试', icon: 'none' });
    }
  },

  /**
   * 跳转到答题页
   */
  navigateToQuizPage(questions, words, filter, mode) {
    // 将题目数据和单词统计数据转换为JSON字符串，以便通过URL传递
    const questionsStr = JSON.stringify(questions);
    const wordsStr = JSON.stringify(words);
    const filterStr = JSON.stringify(filter);

    // 跳转到quiz页面，并通过URL参数传递数据
    wx.navigateTo({
      url: `/pages/quiz/quiz?questions=${encodeURIComponent(questionsStr)}&words=${encodeURIComponent(wordsStr)}&filter=${encodeURIComponent(filterStr)}&mode=${mode}`
    });
  },

  /**
   * 标准模式答题
   */
  navigateToStandardQuiz() {
    const filterManager = require('../../utils/filterManager.js');
    const currentFilter = filterManager.getFilter();
    
    // 如果没有选择词库，提示用户选择
    if (!currentFilter || !currentFilter.dictionaryId) {
      wx.showToast({
        title: '请先选择词库',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 确保使用全部课程
    const updatedFilter = {
      ...currentFilter,
      selectedLessonFiles: [`DICTIONARY_${currentFilter.dictionaryId}_ALL_LESSONS`]
    };
    filterManager.saveFilter(updatedFilter);
    
    wx.navigateTo({
      url: '/pages/quiz/quiz'
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
  },

  // ========== 词库选择弹窗相关方法 ==========

  /**
   * 关闭词库选择弹窗
   */
  onCloseCourseSelector() {
    this.setData({ showCourseSelector: false });
  },

  /**
   * 处理词库选择变化
   */
  onCourseDictionaryChange(e) {
    const { selectedDictionaryIndex } = e.detail;
    this.setData({ selectedDictionaryIndex });
  },

  /**
   * 确认词库选择
   */
  onCourseSelectorConfirm() {
    const selectedDict = this.data.dictionaries[this.data.selectedDictionaryIndex];
    const filterManager = require('../../utils/filterManager.js');
    
    // 保存筛选设置（简化版，只保存词库信息）
    const filterToSave = {
      dictionaryId: selectedDict.id,
      selectedDictionaryIndex: this.data.selectedDictionaryIndex,
      selectedLessonFiles: [`DICTIONARY_${selectedDict.id}_ALL_LESSONS`], // 默认选择全部课程
      selectedQuestionTypes: this.data.selectedQuestionTypes || []
    };
    
    filterManager.saveFilter(filterToSave);
    
    // 更新主页面显示
    this.setData({
      showCourseSelector: false,
      currentFilterDisplay: `当前：${selectedDict.name} - 全部课程`,
      currentTextbookName: selectedDict.name,
      currentTextbookImage: this.getTextbookImage(selectedDict.id)
    });
    
    wx.showToast({
      title: '词库选择已保存',
      icon: 'success',
      duration: 1500
    });
  },

  // ========== 粒子效果相关方法 ==========

  /**
   * 初始化粒子效果
   */
  initParticleEffect() {
    try {
      // 从全局数据获取当前粒子ID
      const app = getApp();
      let currentParticleId = app.globalData.currentParticleId || '';
      
      // 如果全局数据为空，从本地存储获取当前激活的粒子效果 ✨
      if (!currentParticleId) {
        // 获取两个系列的粒子效果设置
        const supplyParticleId = wx.getStorageSync('supplyParticleId') || '';
        const magicParticleId = wx.getStorageSync('magicParticleId') || '';
        
        // 优先使用梦幻魔法系列的设置，如果为空则使用美味补给系列
        // 如果都为空，则默认使用雪花效果
        if (magicParticleId) {
          currentParticleId = magicParticleId;
        } else if (supplyParticleId) {
          currentParticleId = supplyParticleId;
        } else {
          currentParticleId = 'FX-R-03'; // 默认雪花效果
        }
        
        // 同步到全局数据
        app.globalData.currentParticleId = currentParticleId;
      }
      
      // 🔧 特殊处理：如果是麻瓜状态（FX-DEFAULT-01），则不显示粒子效果
      const showParticles = currentParticleId !== 'FX-DEFAULT-01' && currentParticleId !== 'FOOD-DEFAULT-01';
      
      // 获取粒子配置
      const particleConfig = showParticles ? this.getParticleConfig(currentParticleId) : null;
      
      this.setData({
        currentParticleId,
        showParticles, // 根据粒子ID决定是否显示粒子效果 ✨
        particleConfig
      });
      
      // 只有在显示粒子效果时才启动刷新定时器
      if (showParticles) {
        this.startParticleRefresh();
      }
      
      console.log('✨ 粒子效果初始化完成:', { 
        currentParticleId, 
        showParticles,
        isMuggle: currentParticleId === 'FX-DEFAULT-01' || currentParticleId === 'FOOD-DEFAULT-01'
      });
    } catch (error) {
      console.error('❌ 粒子效果初始化失败:', error);
    }
  },

  /**
   * 启动粒子动态刷新
   */
  startParticleRefresh() {
     // 清除之前的定时器
     if (this.data.particleRefreshTimer) {
       clearTimeout(this.data.particleRefreshTimer);
     }
    
    // 每3-8秒随机刷新一次粒子配置
    const refreshParticles = () => {
      // 检查页面是否还在显示状态，只有当前页面可见时才刷新粒子
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const isCurrentPageAnswer = currentPage && currentPage.route === 'pages/answer/answer';
      
      if (isCurrentPageAnswer && this.data.showParticles && this.data.currentParticleId) {
        const newConfig = this.getParticleConfig(this.data.currentParticleId);
        this.setData({ particleConfig: newConfig });
        console.log('🔄 粒子配置已刷新，新数量:', newConfig.count);
        
        // 设置下一次刷新的随机时间间隔（3-8秒）
        const nextInterval = Math.floor(Math.random() * 5000) + 3000;
        this.data.particleRefreshTimer = setTimeout(refreshParticles, nextInterval);
      } else {
        console.log('⏸️ 当前页面不是answer页面，停止粒子刷新');
        // 如果不是answer页面，清除定时器
        if (this.data.particleRefreshTimer) {
          clearTimeout(this.data.particleRefreshTimer);
          this.setData({ particleRefreshTimer: null });
        }
      }
    };
    
    // 首次延迟2-5秒后开始
    const initialDelay = Math.floor(Math.random() * 3000) + 2000;
    this.data.particleRefreshTimer = setTimeout(refreshParticles, initialDelay);
  },

  /**
   * 根据粒子ID获取粒子配置
   * @param {string} particleId 粒子效果ID
   * @returns {Object|null} 粒子配置对象
   */
  getParticleConfig(particleId) {
    if (!particleId) {
      // 如果没有指定粒子ID，返回默认雪花效果
      const randomCount = Math.floor(Math.random() * 6) + 17; // 17-22个粒子随机（更温和的变化）
      return {
        type: 'snow',
        image: '/images/particles/snow.svg',
        count: randomCount,
        duration: 18, // 增加持续时间，让雪花下落更慢
        size: 35
      };
    }
    
    // 粒子配置映射 - 添加随机数量变化
    const baseConfigs = {
      'FX-SSR-01': { // 玫瑰魔法
        type: 'rose',
        image: 'https://free.picui.cn/free/2025/07/20/687cf854b2086.png',
        baseCount: 8, // 调整为8个，范围7-9个
        duration: 15,
        size: 60
      },
      'FX-SR-01': { // 萤火虫
        type: 'firefly',
        image: 'https://free.picui.cn/free/2025/07/20/687cf85445556.png',
        baseCount: 10, // 调整为10个，范围9-11个
        duration: 20,
        size: 40
      },
      'FX-R-01': { // 樱花魔法
        type: 'sakura',
        image: 'https://free.picui.cn/free/2025/07/20/687cf854d8832.png',
        baseCount: 12, // 调整为12个，范围10-14个
        duration: 18,
        size: 50
      },
      'FX-R-02': { // 落叶魔法
        type: 'leaf',
        image: 'https://free.picui.cn/free/2025/07/20/687cf8549c6f3.png',
        baseCount: 12, // 调整为12个，范围10-14个
        duration: 16,
        size: 55
      },
      'FX-R-03': { // 谧雪魔法
        type: 'snow',
        image: '/images/particles/snow.svg',
        baseCount: 20, // 调整为20个，范围17-23个
        duration: 18, // 增加持续时间，让雪花下落更慢
        size: 35
      }
    };
    
    const baseConfig = baseConfigs[particleId];
    if (!baseConfig) return null;
    
    // 随机变化粒子数量：基础数量 ± 15%（更温和的变化）
    const variation = Math.floor(baseConfig.baseCount * 0.15);
    const randomCount = Math.floor(Math.random() * (variation * 2 + 1)) + (baseConfig.baseCount - variation);
    
    return {
      type: baseConfig.type,
      image: baseConfig.image,
      count: Math.max(5, randomCount), // 最少5个粒子
      duration: baseConfig.duration,
      size: baseConfig.size
    };
  }
})
