// data/knowledge_cards.js - 知识点卡片数据管理
// 模拟数据库，用于存储和管理知识点卡片数据

/**
 * 知识点卡片数据库
 * 每个级别包含多个卡片，每个卡片包含固定样式和可配置内容
 */
const knowledgeCardsDB = {
  // N5级别卡片数据
  N5: [
    {
      id: 1,
      level: 'N5',
      card_order: 1,
      card_label_primary: 'GRAMMAR',
      card_label_secondary: '变化',
      card_title: '敬体&简体变化表',
      web_url: '/pages/grammar/grammar?type=verb&title=动词变化表',
      is_active: true,
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    },
    {
      id: 2,
      level: 'N5',
      card_order: 2,
      card_label_primary: 'GRAMMAR',
      card_label_secondary: '知识',
      card_title: '组合动词表',
      web_url: '/pages/grammar/grammar?type=adjective&title=形容词变位',
      is_active: true,
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    },
    {
      id: 3,
      level: 'N5',
      card_order: 3,
      card_label_primary: 'GRAMMAR',
      card_label_secondary: '变化',
      card_title: 'N5动词变化表',
      web_url: '/pages/grammar/grammar?type=sentence&title=基本句型',
      is_active: true,
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    },
    // 暂时隐藏的卡片 - 可以通过修改is_active来启用/禁用
    {
      id: 4,
      level: 'N5',
      card_order: 4,
      card_label_primary: 'VOCABULARY',
      card_label_secondary: '基础',
      card_title: 'N5核心词汇',
      web_url: '/pages/vocabulary/vocabulary?level=N5&type=core',
      is_active: true, // 启用第4张卡片
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    },
    {
      id: 5,
      level: 'N5',
      card_order: 5,
      card_label_primary: 'READING',
      card_label_secondary: '练习',
      card_title: '阅读理解训练',
      web_url: '/pages/reading/reading?level=N5',
      is_active: false, // 暂时禁用
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    },
    {
      id: 6,
      level: 'N5',
      card_order: 6,
      card_label_primary: 'LISTENING',
      card_label_secondary: '听力',
      card_title: '听力练习',
      web_url: '/pages/listening/listening?level=N5',
      is_active: false, // 暂时禁用
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    }
  ],

  // N4级别卡片数据（示例）
  N4: [
    {
      id: 7,
      level: 'N4',
      card_order: 1,
      card_label_primary: 'GRAMMAR',
      card_label_secondary: '进阶',
      card_title: 'N4语法要点',
      web_url: '/pages/grammar/grammar?type=n4&title=N4语法',
      is_active: true,
      created_at: '2024-07-13T10:00:00Z',
      updated_at: '2024-07-13T10:00:00Z'
    }
  ],

  // N3级别卡片数据（预留）
  N3: [],

  // N2级别卡片数据（预留）
  N2: [],

  // N1级别卡片数据（预留）
  N1: []
};

/**
 * 卡片样式配置
 * 定义6种不同的卡片样式，包括背景图片和渐变色
 */
const cardStyleConfig = {
  1: {
    backgroundImage: '/images/card/N5-Card1.jpg',
    gradientClass: 'card-style-1',
    gradientColors: ['#EEE0FF', '#F0F6FC']
  },
  2: {
    backgroundImage: '/images/card/N5-Card2.jpg',
    gradientClass: 'card-style-2',
    gradientColors: ['#DBDAFF', '#EDF6FF']
  },
  3: {
    backgroundImage: '/images/card/N5-Card3.jpg',
    gradientClass: 'card-style-3',
    gradientColors: ['#FFCFE1', '#FFFAFC']
  },
  4: {
    backgroundImage: '/images/card/N5-Card4.jpg',
    gradientClass: 'card-style-4',
    gradientColors: ['#E3FFC5', '#EBFFF0']
  },
  5: {
    backgroundImage: '/images/card/N5-Card5.jpg',
    gradientClass: 'card-style-5',
    gradientColors: ['#B2F3F4', '#F6FFFD']
  },
  6: {
    backgroundImage: '/images/card/N5-Card6.jpg',
    gradientClass: 'card-style-6',
    gradientColors: ['#E7FFAE', '#FFFFEA']
  }
};

/**
 * 数据库操作方法
 */
const KnowledgeCardsDB = {
  /**
   * 根据级别获取卡片数据
   * @param {string} level - 级别 (N5, N4, N3, N2, N1)
   * @returns {Array} 卡片数据数组
   */
  getCardsByLevel: function(level) {
    const cards = knowledgeCardsDB[level] || [];
    return cards.filter(card => card.is_active);
  },

  /**
   * 根据级别获取卡片数量
   * @param {string} level - 级别
   * @returns {number} 卡片数量
   */
  getCardCountByLevel: function(level) {
    return this.getCardsByLevel(level).length;
  },

  /**
   * 为卡片数据添加样式信息
   * @param {Array} cards - 卡片数据数组
   * @returns {Array} 带有样式信息的卡片数组
   */
  addStyleToCards: function(cards) {
    return cards.map((card, index) => {
      const styleType = (index % 6) + 1;
      const styleConfig = cardStyleConfig[styleType];
      
      return {
        id: card.id,
        category: card.card_label_primary,
        subcategory: card.card_label_secondary,
        title: card.card_title,
        backgroundImage: styleConfig.backgroundImage,
        styleType: styleType,
        webUrl: card.web_url
      };
    });
  },

  /**
   * 获取指定级别的完整卡片数据（包含样式）
   * @param {string} level - 级别
   * @returns {Array} 完整的卡片数据数组
   */
  getCompleteCardsByLevel: function(level) {
    const cards = this.getCardsByLevel(level);
    return this.addStyleToCards(cards);
  },

  /**
   * 添加新卡片
   * @param {Object} cardData - 卡片数据
   * @returns {boolean} 是否添加成功
   */
  addCard: function(cardData) {
    const level = cardData.level;
    if (!knowledgeCardsDB[level]) {
      knowledgeCardsDB[level] = [];
    }
    
    const newCard = {
      id: Date.now(), // 简单的ID生成
      ...cardData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    knowledgeCardsDB[level].push(newCard);
    return true;
  },

  /**
   * 更新卡片数据
   * @param {number} cardId - 卡片ID
   * @param {Object} updateData - 更新数据
   * @returns {boolean} 是否更新成功
   */
  updateCard: function(cardId, updateData) {
    for (let level in knowledgeCardsDB) {
      const cards = knowledgeCardsDB[level];
      const cardIndex = cards.findIndex(card => card.id === cardId);
      
      if (cardIndex !== -1) {
        knowledgeCardsDB[level][cardIndex] = {
          ...cards[cardIndex],
          ...updateData,
          updated_at: new Date().toISOString()
        };
        return true;
      }
    }
    return false;
  },

  /**
   * 删除卡片（软删除）
   * @param {number} cardId - 卡片ID
   * @returns {boolean} 是否删除成功
   */
  deleteCard: function(cardId) {
    return this.updateCard(cardId, { is_active: false });
  }
};

module.exports = {
  KnowledgeCardsDB,
  cardStyleConfig
}; 