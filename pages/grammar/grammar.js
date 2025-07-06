// pages/grammar/grammar.js
Page({
  data: {
    title: '敬体&简体变化表',
    grammarData: {
      sections: [
        {
          id: 1,
          title: '1. 名词变化表',
          level: 3,
          type: 'table',
          tableData: {
            headers: ['状态', '内容', '状态', '内容'],
            rows: [
              ['简体肯定', 'だ', '简体否定', 'ではない（じゃない）'],
              ['敬体肯定', 'です', '敬体否定', 'ではありません'],
              ['简体过去肯定', 'だった', '简体过去否定', 'ではなかった（じゃなかった）'],
              ['敬体过去肯定', 'でした', '敬体过去否定', 'ではありませんでした']
            ]
          }
        },
        {
          id: 2,
          title: '2. 动词变化表',
          level: 3,
          type: 'section',
          subsections: [
            {
              id: 21,
              title: '2.1. 五段动词',
              level: 4,
              type: 'table',
              tableData: {
                headers: ['状态', '内容', '状态', '内容'],
                rows: [
                  ['简体肯定', '書く', '简体否定', '書かない'],
                  ['敬体肯定', '書きます', '敬体否定', '書きません'],
                  ['简体过去肯定', '書いた', '简体过去否定', '書かなかった'],
                  ['敬体过去肯定', '書きました', '敬体过去否定', '書きませんでした']
                ]
              }
            },
            {
              id: 22,
              title: '2.2. 一段动词',
              level: 4,
              type: 'table',
              tableData: {
                headers: ['状态', '内容', '状态', '内容'],
                rows: [
                  ['简体肯定', '食べる', '简体否定', '食べない'],
                  ['敬体肯定', '食べます', '敬体否定', '食べません'],
                  ['简体过去肯定', '食べた', '简体过去否定', '食べなかった'],
                  ['敬体过去肯定', '食べました', '敬体过去否定', '食べませんでした']
                ]
              }
            },
            {
              id: 23,
              title: '2.3. サ变动词（する）',
              level: 4,
              type: 'table',
              tableData: {
                headers: ['状态', '内容', '状态', '内容'],
                rows: [
                  ['简体肯定', 'する', '简体否定', 'しない'],
                  ['敬体肯定', 'します', '敬体否定', 'しません'],
                  ['简体过去肯定', 'した', '简体过去否定', 'しなかった'],
                  ['敬体过去肯定', 'しました', '敬体过去否定', 'しませんでした']
                ]
              }
            },
            {
              id: 24,
              title: '2.4. カ变动词（来る / くる）',
              level: 4,
              type: 'table',
              tableData: {
                headers: ['状态', '内容', '状态', '内容'],
                rows: [
                  ['简体肯定', '来る（くる）', '简体否定', '来ない（こない）'],
                  ['敬体肯定', '来ます（きます）', '敬体否定', '来ません（きません）'],
                  ['简体过去肯定', '来た（きた）', '简体过去否定', '来なかった（こなかった）'],
                  ['敬体过去肯定', '来ました（きました）', '敬体过去否定', '来ませんでした（きませんでした）']
                ]
              }
            }
          ]
        },
        {
          id: 3,
          title: '3. 形容词变化表',
          level: 3,
          type: 'section',
          subsections: [
            {
              id: 31,
              title: '3.1. イ形容词（例：高い）',
              level: 4,
              type: 'table',
              tableData: {
                headers: ['状态', '内容', '状态', '内容'],
                rows: [
                  ['简体肯定', '高い', '简体否定', '高くない'],
                  ['敬体肯定', '高いです', '敬体否定', '高くないです'],
                  ['简体过去肯定', '高かった', '简体过去否定', '高くなかった'],
                  ['敬体过去肯定', '高かったです', '敬体过去否定', '高くなかったです']
                ]
              }
            },
            {
              id: 32,
              title: '3.2. ナ形容词（例：静か），同名词',
              level: 4,
              type: 'table',
              tableData: {
                headers: ['状态', '内容', '状态', '内容'],
                rows: [
                  ['简体肯定', '静かだ', '简体否定', '静かではない'],
                  ['敬体肯定', '静かです', '敬体否定', '静かではありません'],
                  ['简体过去肯定', '静かだった', '简体过去否定', '静かではなかった'],
                  ['敬体过去肯定', '静かでした', '敬体过去否定', '静かではありませんでした']
                ]
              }
            }
          ]
        }
      ]
    }
  },

  onLoad: function (options) {
    // 可以从参数中获取特定的语法类型
    if (options.type) {
      this.setData({
        title: options.title || '语法详情'
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成后，CSS table布局会自动计算最优宽度
    console.log('Grammar page ready - CSS table layout will handle column widths automatically');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时的逻辑
  },

  /**
   * 获取表格统计信息（可选功能）
   */
  getTableStats() {
    const that = this;
    
    // 获取所有表格的宽度信息
    const query = wx.createSelectorQuery();
    query.selectAll('.table').boundingClientRect((tables) => {
      if (!tables || tables.length === 0) return;
      
      tables.forEach((table, index) => {
        console.log(`Table ${index + 1} width: ${table.width}px`);
        
        // 获取该表格的所有单元格宽度
        const cellQuery = wx.createSelectorQuery();
        cellQuery.selectAll(`.table:nth-child(${index + 1}) .table-cell`).boundingClientRect((cells) => {
          if (cells && cells.length > 0) {
            const columnCount = that.getColumnCount(index);
            const columnWidths = [];
            
            // 计算每列的宽度
            for (let i = 0; i < columnCount; i++) {
              const columnCells = cells.filter((cell, cellIndex) => cellIndex % columnCount === i);
              const maxWidth = Math.max(...columnCells.map(cell => cell.width));
              columnWidths.push(maxWidth);
            }
            
            console.log(`Table ${index + 1} column widths:`, columnWidths);
            console.log(`Table ${index + 1} total width: ${columnWidths.reduce((sum, width) => sum + width, 0)}px`);
          }
        }).exec();
      });
    }).exec();
  },

  /**
   * 获取指定表格的列数
   */
  getColumnCount(tableIndex) {
    const grammarData = this.data.grammarData;
    let currentIndex = 0;
    
    for (let section of grammarData.sections) {
      if (section.type === 'table') {
        if (currentIndex === tableIndex) {
          return section.tableData.headers.length;
        }
        currentIndex++;
      } else if (section.subsections) {
        for (let subsection of section.subsections) {
          if (subsection.type === 'table') {
            if (currentIndex === tableIndex) {
              return subsection.tableData.headers.length;
            }
            currentIndex++;
          }
        }
      }
    }
    
    return 4; // 默认4列
  },

  /**
   * 返回按钮处理
   */
  goBack() {
    wx.navigateBack();
  }
}) 