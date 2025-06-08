// pages/vocabulary/vocabulary.js
Page({
  data: {
    words: [
      { word: '日本語', reading: 'にほんご', meaning: 'Japanese language', type: 'noun', sentence: '私は日本語を話します。' },
      { word: '学生', reading: 'がくせい', meaning: 'student', type: 'noun', sentence: '私は大学生です。' },
      // 添加更多单词...
    ],
    displayMode: 'list', // 'list' or 'card'
    searchQuery: '',
    filteredWords: []
  },
  onLoad: function (options) {
    this.setData({ filteredWords: this.data.words })
  },
  toggleDisplayMode: function () {
    this.setData({
      displayMode: this.data.displayMode === 'list' ? 'card' : 'list'
    })
  },
  onSearchInput: function (e) {
    const query = e.detail.value
    const filteredWords = this.data.words.filter(word => 
      word.word.includes(query) || word.meaning.includes(query)
    )
    this.setData({
      searchQuery: query,
      filteredWords: filteredWords
    })
  },
  // 其他可能的功能，如筛选、排序等
})
