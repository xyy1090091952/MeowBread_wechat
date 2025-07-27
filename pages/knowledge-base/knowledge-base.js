// 知识库页面通用逻辑 - 按照Markdown导入制作规范
const knowledgeDataModule = require('./knowledge-data.js');

Page({
  data: {
    title: '',
    sections: [],
    loading: true,
    error: ''
  },

  onLoad(options) {
    console.log('知识库页面加载，参数:', options);
    
    // 获取知识库ID
    const knowledgeId = options.id || options.knowledgeId || 'N5_1';
    console.log('知识库ID:', knowledgeId);
    
    this.loadKnowledgeData(knowledgeId);
  },

  /**
   * 加载知识库数据
   */
  loadKnowledgeData(knowledgeId) {
    try {
      this.setData({ loading: true, error: '' });
      
      // 从数据模块获取知识库数据
      const knowledgeData = knowledgeDataModule.getKnowledgeData(knowledgeId);
      
      if (!knowledgeData) {
        throw new Error(`未找到知识库: ${knowledgeId}`);
      }
      
      console.log('加载的知识库数据:', knowledgeData);
      
      // 设置页面数据，使用规范的变量名
       this.setData({
         title: knowledgeData.title,
         sections: knowledgeData.sections || [],
         loading: false,
         error: ''
       });
      
    } catch (error) {
      console.error('加载知识库数据失败:', error);
      this.setData({
        loading: false,
        error: error.message || '加载失败，请重试'
      });
    }
  },

  /**
   * 重试加载
   */
  onRetry() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options;
    const knowledgeId = options.id || options.knowledgeId || 'N5_1';
    this.loadKnowledgeData(knowledgeId);
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options;
    const knowledgeId = options.id || options.knowledgeId || 'N5_1';
    
    return {
      title: this.data.title,
      path: `/pages/knowledge-base/knowledge-base?id=${knowledgeId}`,
      imageUrl: '' // 可以设置分享图片
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options;
    const knowledgeId = options.id || options.knowledgeId || 'N5_1';
    
    return {
      title: this.data.title,
      query: `id=${knowledgeId}`,
      imageUrl: '' // 可以设置分享图片
    };
  }
});