const app = getApp();

Component({
  data: {
    selected: 0,
    show: true, // 控制tabbar显示/隐藏
    color: "#9B9BFA",
    selectedColor: "#4845F7",
    indicatorLeft: 0, // 动态计算的indicator位置
    // 动画管理相关属性
    animationQueue: [], // 动画队列
    isAnimating: false, // 当前是否正在播放动画
    currentAnimationTimer: null, // 当前动画定时器
    animationDisabled: false, // 是否禁用动画
    animationDuration: 200, // 动画时长(ms)
    tabList: [
      {
        pagePath: "pages/answer/answer",
        text: "答题",
        iconPath: "/images/tab/answer.png",
        selectedIconPath: "/images/tab/answer_selected.png"
      },
      {
        pagePath: "pages/vocabulary/vocabulary",
        text: "单词库",
        iconPath: "/images/tab/vocabulary.png",
        selectedIconPath: "/images/tab/vocabulary_selected.png"
      },
      {
        pagePath: "pages/knowledge/knowledge",
        text: "知识点",
        iconPath: "/images/tab/knowledge.png",
        selectedIconPath: "/images/tab/knowledge_selected.png"
      },
      {
        pagePath: "pages/profile/profile",
        text: "我的",
        iconPath: "/images/tab/profile.png",
        selectedIconPath: "/images/tab/profile_selected.png"
      }
    ]
  },

  lifetimes: {
    ready() {
      // 组件准备好后，设置初始indicator位置
      this.setIndicatorToPosition(this.data.selected);
    }
  },
  
  methods: {
    switchTab(e) {
      const newIndex = e.currentTarget.dataset.index;
      const oldIndex = this.data.selected;
      const path = this.data.tabList[newIndex].pagePath;
      
      // 立即更新选中状态
      this.setData({ selected: newIndex });
      
      // 添加动画到队列（会自动处理冲突）
      this.queueAnimation(newIndex, oldIndex);
      
      // 跳转页面
      wx.switchTab({ url: '/' + path });
    },

    updateSelected(index) {
      // 更新选中状态并移动indicator
      this.setData({ selected: index });
      this.queueAnimation(index);
    },

    // 动画队列管理 - 防止快速点击导致的闪烁
    queueAnimation(targetIndex, fromIndex = null) {
      console.log(`[动画队列] 请求动画: ${fromIndex} → ${targetIndex}`);
      
      // 如果正在播放动画，先强制停止当前动画
      if (this.data.isAnimating) {
        this.forceStopCurrentAnimation();
      }
      
      // 清空之前的队列，只保留最新的动画请求
      this.setData({
        animationQueue: [{
          targetIndex: targetIndex,
          fromIndex: fromIndex
        }]
      });
      
      // 开始播放动画
      this.playNextAnimation();
    },

    // 强制停止当前动画（不移动indicator）
    forceStopCurrentAnimation() {
      if (this.data.currentAnimationTimer) {
        clearTimeout(this.data.currentAnimationTimer);
        console.log('[动画控制] 强制停止当前动画');
      }
      
      this.setData({
        currentAnimationTimer: null,
        isAnimating: false
      });
    },

    // 播放下一个动画
    playNextAnimation() {
      // 添加安全检查，确保animationQueue存在且为数组
      const animationQueue = this.data.animationQueue || [];
      if (animationQueue.length === 0 || this.data.isAnimating) {
        console.log(`[动画队列] 跳过播放: 队列长度=${animationQueue.length}, 正在动画=${this.data.isAnimating}`);
        return;
      }

      const animation = animationQueue.shift(); // 从队列中取出第一个动画
      this.setData({
        animationQueue: animationQueue, // 更新队列
        isAnimating: true // 标记正在播放动画
      });
      
      console.log(`[动画执行] 开始播放: ${animation.fromIndex} → ${animation.targetIndex}`);
      this.setIndicatorToPosition(animation.targetIndex, animation.fromIndex);
    },

    // 设置indicator到指定位置（会触发CSS动画）
    setIndicatorToPosition(index, fromIndex = null) {
      const query = this.createSelectorQuery();
      query.selectAll('.tab-item').boundingClientRect((rects) => {
        if (rects && rects[index]) {
          const targetLeft = rects[index].left;
          
          // 确保当前状态正确
          if (this.data.indicatorLeft === targetLeft) {
            // 如果已经在目标位置，直接完成
            console.log(`[动画跳过] 已在目标位置 tab${index}`);
            this.setData({
              isAnimating: false,
              currentAnimationTimer: null
            });
            this.playNextAnimation();
            return;
          }
          
          // 计算动画时长并输出日志
          let animationDuration = 200; // 默认200ms
          if (fromIndex !== null && fromIndex !== index) {
            const distance = Math.abs(index - fromIndex);
            animationDuration = this.calculateAnimationDuration(distance);
            console.log(`[动画移动] tab${fromIndex} → tab${index}, 距离:${distance}, 时长:${animationDuration}ms`);
          } else {
            console.log(`[动画初始化] 设置到tab${index}, 位置:${targetLeft}px`);
          }
          
          // 设置动画时长并移动
          this.setAnimationDuration(animationDuration);
          this.setData({
            indicatorLeft: targetLeft
          });
          
          // 设置动画完成回调
          const timer = setTimeout(() => {
            this.setData({
              isAnimating: false,
              currentAnimationTimer: null
            });
            console.log(`[动画完成] tab${index} 动画结束`);
            
            // 播放队列中的下一个动画
            this.playNextAnimation();
          }, animationDuration);
          
          this.setData({
            currentAnimationTimer: timer
          });
        }
      }).exec();
    },

    // 计算动画时长
    calculateAnimationDuration(distance) {
      // 基础时长150ms，每增加1个距离增加50ms
      // 距离1: 150ms, 距离2: 200ms, 距离3: 250ms
      const baseDuration = 150;
      const extraDuration = (distance - 1) * 50;
      return baseDuration + extraDuration;
    },

    // 设置动画时长
    setAnimationDuration(duration) {
      // 通过修改CSS类的方式更可靠地设置动画时长
      if (duration === 0) {
        // 禁用动画
        this.setData({
          animationDisabled: true
        });
      } else {
        // 启用动画并设置时长
        this.setData({
          animationDisabled: false,
          animationDuration: duration
        });
      }
    }
  }
});