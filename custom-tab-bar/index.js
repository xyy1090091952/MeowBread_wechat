Component({
  data: {
    selected: null, // 初始状态设为 null，以识别首次加载
    color: "#9B9BFA",
    selectedColor: "#4845F7",
    indicatorLeft: 0,
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
  attached() {
    // attached 生命周期中不再初始化指示器
    // 指示器的位置完全由页面的 onShow 事件驱动
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const path = this.data.tabList[index].pagePath;
      // 仅负责页面跳转，状态更新交由目标页面的 onShow 处理
      // 这样可以避免竞态条件，保证状态来源单一
      wx.switchTab({ url: '/' + path });
    },
    updateSelected(index) {
      // 如果已经是当前选中的 tab，则不执行任何操作
      if (this.data.selected === index) {
        return;
      }
      this.setData({ selected: index });
      this.updateIndicator();
    },

    updateIndicator() {
      // 使用 nextTick 确保在 DOM 更新后执行
      wx.nextTick(() => {
        const query = wx.createSelectorQuery().in(this);
        query.selectAll('.tab-item').boundingClientRect(rects => {
          if (rects && rects.length > this.data.selected) {
            const rect = rects[this.data.selected];
            // 直接设置指示器的位置，不再有动画
            this.setData({ indicatorLeft: rect.left });
          }
        }).exec();
      });
    }
  }
});