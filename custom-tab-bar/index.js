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
      
      // 播放动画到新位置，根据距离调整时长
      this.setIndicatorToPosition(newIndex, oldIndex);
      
      // 跳转页面
      wx.switchTab({ url: '/' + path });
    },

    updateSelected(index) {
      // 更新选中状态并移动indicator
      this.setData({ selected: index });
      this.setIndicatorToPosition(index);
    },

    // 设置indicator到指定位置（会触发CSS动画）
    setIndicatorToPosition(index, fromIndex = null) {
      const query = this.createSelectorQuery();
      query.selectAll('.tab-item').boundingClientRect((rects) => {
        if (rects && rects[index]) {
          const targetLeft = rects[index].left;
          
          // 如果提供了起始位置，根据距离调整动画时长
          if (fromIndex !== null && fromIndex !== index) {
            const distance = Math.abs(index - fromIndex);
            this.setAnimationDuration(distance);
            console.log(`移动indicator: tab${fromIndex} → tab${index}, 距离:${distance}, 位置:${targetLeft}px`);
          } else {
            console.log(`设置indicator到tab ${index}, 位置: ${targetLeft}px`);
          }
          
          this.setData({
            indicatorLeft: targetLeft
          });
        }
      }).exec();
    },

    // 根据距离设置动画时长
    setAnimationDuration(distance) {
      // 基础时长150ms，每增加1个距离增加50ms
      // 距离1: 150ms, 距离2: 200ms, 距离3: 250ms
      const baseDuration = 150;
      const extraDuration = (distance - 1) * 50;
      const totalDuration = baseDuration + extraDuration;
      
      // 动态修改CSS transition属性
      const query = this.createSelectorQuery();
      query.select('.indicator').node().exec((res) => {
        if (res[0] && res[0].node) {
          const indicatorElement = res[0].node;
          indicatorElement.style.transition = `left ${totalDuration}ms ease`;
          
          // 动画结束后恢复默认时长
          setTimeout(() => {
            indicatorElement.style.transition = 'left 0.2s ease';
          }, totalDuration + 50);
        }
      });
    }
  }
});