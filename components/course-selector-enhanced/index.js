// components/course-selector-enhanced/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 控制弹窗显示/隐藏
    visible: {
      type: Boolean,
      value: false
    },
    // 词典数据，包含volumes和courses信息
    dictionaryData: {
      type: Object,
      value: null
    },
    // 默认选中的值
    defaultValue: {
      type: String,
      value: 'all'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    modalAnimationClass: '', // 遮罩动画类名
    volumes: [], // 分册列表
    currentVolumeId: '', // 当前选中的分册ID
    currentCourses: [], // 当前分册的课程列表
    currentVolumeDesc: '', // 当前分册描述
    selectedValue: 'all', // 当前选中的课程值
    indicatorLeft: '50%' // 指示器位置
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化数据
     */
    initData() {
      const { dictionaryData, defaultValue } = this.properties;
      
      if (!dictionaryData || !dictionaryData.volumes || !dictionaryData.courses) {
        console.warn('课程选择器：词典数据不完整');
        return;
      }

      const volumes = dictionaryData.volumes;
      const courses = dictionaryData.courses;

      // 如果没有分册信息，创建一个默认分册
      let processedVolumes = volumes;
      if (volumes.length === 0) {
        processedVolumes = [{
          id: 'all',
          name: '全部',
          description: '所有课程',
          lessons: courses.map(c => c.courseNumber)
        }];
      }

      // 设置默认选中第一个分册
      const defaultVolumeId = processedVolumes[0].id;
      const defaultVolume = processedVolumes[0];
      
      // 获取当前分册的课程列表
      const currentCourses = courses.filter(course => 
        defaultVolume.lessons.includes(course.courseNumber)
      );

      this.setData({
        volumes: processedVolumes,
        currentVolumeId: defaultVolumeId,
        currentCourses: currentCourses,
        currentVolumeDesc: defaultVolume.description,
        selectedValue: defaultValue,
        indicatorLeft: this.calculateIndicatorPosition(0, processedVolumes.length)
      });
    },

    /**
     * 计算指示器位置 - 学习gashapon页面的精确算法
     * @param {number} index - 当前选中的tag索引
     * @param {number} total - tag总数
     */
    calculateIndicatorPosition(index, total) {
      if (total <= 1) return 'calc(50% - 64rpx)';
      
      // 使用gashapon页面的精确算法
      // 指示器宽度128rpx，所以需要减去64rpx来居中
      if (total === 2) {
        // 两个tag的情况：第一个在25%，第二个在75%
        if (index === 0) {
          return 'calc(25% - 64rpx + 24rpx)'; // 第一个tag，加上边距补偿
        } else {
          return 'calc(75% - 64rpx - 24rpx)'; // 第二个tag，减去边距补偿
        }
      } else {
        // 多个tag的情况，平均分布
        const tagWidth = 100 / total;
        const centerPosition = tagWidth * index + tagWidth / 2;
        return `calc(${centerPosition}% - 64rpx)`;
      }
    },

    /**
     * 选择分册
     * @param {Object} e - 事件对象
     */
    onSelectVolume(e) {
      const volumeId = e.currentTarget.dataset.id;
      const { volumes, currentVolumeId } = this.data;
      const { dictionaryData } = this.properties;
      
      if (volumeId === currentVolumeId) return;

      // 找到选中的分册
      const selectedVolume = volumes.find(v => v.id === volumeId);
      if (!selectedVolume) return;

      // 获取当前分册的课程列表
      const currentCourses = dictionaryData.courses.filter(course => 
        selectedVolume.lessons.includes(course.courseNumber)
      );

      // 计算指示器位置
      const volumeIndex = volumes.findIndex(v => v.id === volumeId);
      const indicatorLeft = this.calculateIndicatorPosition(volumeIndex, volumes.length);

      this.setData({
        currentVolumeId: volumeId,
        currentCourses: currentCourses,
        currentVolumeDesc: selectedVolume.description,
        selectedValue: 'all', // 切换分册时重置为全部课程
        indicatorLeft: indicatorLeft
      });
    },

    /**
     * 选择课程
     * @param {Object} e - 事件对象
     */
    onSelectCourse(e) {
      const value = e.currentTarget.dataset.value;
      this.setData({
        selectedValue: value === 'all' ? 'all' : Number(value)
      });
    },

    /**
     * 确认选择
     */
    onConfirm() {
      const { selectedValue, currentVolumeId } = this.data;
      
      // 构建返回数据
      let resultData = {
        value: selectedValue,
        volumeId: currentVolumeId
      };

      if (selectedValue === 'all') {
        // 选择全部课程
        const currentVolume = this.data.volumes.find(v => v.id === currentVolumeId);
        resultData.label = `全部课程`;
        resultData.description = currentVolume ? currentVolume.description : '';
      } else {
        // 选择具体课程 - 使用新的数据结构：courseTitle + description
        const selectedCourse = this.data.currentCourses.find(c => c.courseNumber === selectedValue);
        if (selectedCourse) {
          resultData.label = selectedCourse.description 
            ? `${selectedCourse.courseTitle} ${selectedCourse.description}`
            : selectedCourse.courseTitle;
          resultData.description = selectedCourse.description || '';
        }
      }

      // 触发确认事件
      this.triggerEvent('confirm', resultData);
      this.closePopup();
    },

    /**
     * 关闭弹窗
     */
    closePopup() {
      this.setData({ modalAnimationClass: '' });
      this.triggerEvent('close');
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation(e) {
      // 阻止事件冒泡
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
    },

    /**
     * 阻止滚动穿透
     */
    preventPropagation(e) {
      // 阻止滚动穿透和事件冒泡
      if (e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        if (e.preventDefault) {
          e.preventDefault();
        }
      }
      return false;
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例被放入页面节点树后执行
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'visible': function(visible) {
      if (visible) {
        // 弹窗显示时初始化数据
        this.initData();
        // 添加显示动画
        setTimeout(() => {
          this.setData({ modalAnimationClass: 'show' });
        }, 50);
      } else {
        // 弹窗隐藏时清除动画
        this.setData({ modalAnimationClass: '' });
      }
    },
    
    'dictionaryData': function(dictionaryData) {
      if (dictionaryData && this.properties.visible) {
        this.initData();
      }
    }
  }
});