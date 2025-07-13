const app = getApp();

Component({
  data: {
    selected: 0,
    show: true,
    color: "#9B9BFA",
    selectedColor: "#4845F7",
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

  methods: {
    switchTab(e) {
      const newIndex = e.currentTarget.dataset.index;
      const path = this.data.tabList[newIndex].pagePath;
      
      if (newIndex === this.data.selected) {
        return;
      }

      this.setData({ selected: newIndex });
      wx.switchTab({ url: '/' + path });
    },

    // 这个函数现在是必须的，页面需要通过它来确保高亮正确
    updateSelected(index) {
      this.setData({ selected: index });
    }
  }
});