const app = getApp();

Component({
  data: {
    selected: 0,
    show: true, // 控制tabbar显示/隐藏
    color: "#9B9BFA",
    selectedColor: "#4845F7",
    indicatorLeft: 0, // 动态计算的indicator位置
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

  // 动画管理相关属性
  animationQueue: [], // 动画队列
  isAnimating: false, // 当前是否正在播放动画
  currentAnimationTimer: null, // 当前动画定时器

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
      // 如果正在播放动画，先强制完成当前动画
      if (this.isAnimating) {
        this.forceCompleteCurrentAnimation();
      }
      
      // 清空之前的队列，只保留最新的动画请求
      this.animationQueue = [{
        targetIndex: targetIndex,
        fromIndex: fromIndex
      }];
      
      // 开始播放动画
      this.playNextAnimation();
    },

    // 强制完成当前动画
    forceCompleteCurrentAnimation() {
      if (this.currentAnimationTimer) {
        clearTimeout(this.currentAnimationTimer);
        this.currentAnimationTimer = null;
      }
      this.isAnimating = false;
      console.log('强制完成当前动画');
    },

    // 播放下一个动画
    playNextAnimation() {
      if (this.animationQueue.length === 0 || this.isAnimating) {
        return;
      }

      const animation = this.animationQueue.shift();
      this.isAnimating = true;
      
      console.log(`开始播放动画: ${animation.fromIndex} → ${animation.targetIndex}`);
      this.setIndicatorToPosition(animation.targetIndex, animation.fromIndex);
    },

    // 设置indicator到指定位置（会触发CSS动画）
    setIndicatorToPosition(index, fromIndex = null) {
      const query = this.createSelectorQuery();
      query.selectAll('.tab-item').boundingClientRect((rects) => {
        if (rects && rects[index]) {
          const targetLeft = rects[index].left;
          
          // 计算动画时长
          let animationDuration = 200; // 默认200ms
          if (fromIndex !== null && fromIndex !== index) {
            const distance = Math.abs(index - fromIndex);
            animationDuration = this.calculateAnimationDuration(distance);
            console.log(`移动indicator: tab${fromIndex} → tab${index}, 距离:${distance}, 时长:${animationDuration}ms`);
          } else {
            console.log(`设置indicator到tab ${index}, 位置: ${targetLeft}px`);
          }
          
          // 设置动画时长并移动
          this.setAnimationDuration(animationDuration);
          this.setData({
            indicatorLeft: targetLeft
          });
          
          // 设置动画完成回调
          this.currentAnimationTimer = setTimeout(() => {
            this.isAnimating = false;
            this.currentAnimationTimer = null;
            console.log('动画播放完成');
            
            // 播放队列中的下一个动画
            this.playNextAnimation();
          }, animationDuration);
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
      // 动态修改CSS transition属性
      const query = this.createSelectorQuery();
      query.select('.indicator').node().exec((res) => {
        if (res[0] && res[0].node) {
          const indicatorElement = res[0].node;
          indicatorElement.style.transition = `left ${duration}ms ease`;
        }
      });
    }
  }
});