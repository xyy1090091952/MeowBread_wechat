Component({
  data: {
    selected: 0,
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
    // 设置当前选中项
    const pages = getCurrentPages();
    const route = pages[pages.length - 1].route;
    const index = this.data.tabList.findIndex(item => item.pagePath === route);
    if (index !== -1) {
      this.setData({ selected: index });
    }
    this.updateIndicator();
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const path = this.data.tabList[index].pagePath;
      wx.switchTab({ url: "/" + path });
      this.setData({ selected: index }, () => {
        this.updateIndicator();
      });
    },
    updateSelected(index) {
      this.setData({ selected: index }, () => {
        this.updateIndicator();
      });
    },
    updateIndicator() {
      // 查询当前选中 tab-item 的位置
      wx.createSelectorQuery()
        .in(this)
        .selectAll('.tab-item')
        .boundingClientRect(rects => {
          if (rects && rects[this.data.selected]) {
            this.setData({ indicatorLeft: rects[this.data.selected].left });
          }
        })
        .exec();
    }
  }
}); 