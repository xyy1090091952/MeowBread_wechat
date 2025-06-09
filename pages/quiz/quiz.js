// pages/quiz/quiz.js
// 词典列表将从 database/dictionaries.json 动态获取，或根据 basePath 和 lessonFile 动态确定课程

Page({

  /**
   * 页面的初始数据
   */
  data: {
    quizMode: '', // 答题模式: quick 或 endless
    lessonFile: '', // 课程范围标识
    dictionaryId: '', // 当前词典ID ('all' 或具体ID)
    basePath: '', // 当前词典的基础路径 (如果非'all')
    allWordsInLesson: [], // 当前范围的所有单词
    questions: [], // 题目列表
    currentQuestionIndex: 0, // 当前题目索引
    userAnswer: '', // 用户答案
    selectedOption: null, // 用户选择的选项 (针对选择题)
    showAnswerCard: false, // 是否显示答案卡片
    isCorrect: false, // 当前答案是否正确
    score: 0, // 得分
    totalQuestions: 0, // 总题数 (快速答题模式)
    timeSpent: 0, // 用时
    timer: null, // 计时器
    isLoading: true // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const lessonFile = options.lessonFile ? decodeURIComponent(options.lessonFile) : '';
    const dictionaryId = options.dictionaryId ? decodeURIComponent(options.dictionaryId) : 'all';
    const basePath = options.basePath ? decodeURIComponent(options.basePath) : '';

    this.setData({
      quizMode: options.mode || 'quick',
      lessonFile: lessonFile,
      dictionaryId: dictionaryId,
      basePath: basePath,
      isLoading: true
    });

    if (!lessonFile) {
      wx.showModal({
        title: '错误',
        content: '未指定课程范围，无法开始答题。',
        showCancel: false,
        confirmText: '返回',
        success: () => wx.navigateBack()
      });
      return;
    }
    this.loadQuestionsAndWords();
    // 计时器应在题目加载完成后启动
  },

  // 加载单词和题目数据
  loadQuestionsAndWords() {
    const { lessonFile, dictionaryId, basePath } = this.data;
    let wordsToLoad = [];

    try {
      let dictionariesConfig = [];
      try {
        // 使用 FileSystemManager 读取 JSON 文件
        const fs = wx.getFileSystemManager();
        const dictionariesPath = `${wx.env.USER_DATA_PATH}/../../database/dictionaries.json`.replace('/../../', '/'); // 小程序中需要处理相对路径
        // 注意：直接使用 '../../database/dictionaries.json' 对于 FileSystemManager 可能不是预期的工作方式
        // 小程序的文件系统路径比较特殊，通常我们操作的是 wx.env.USER_DATA_PATH 下的文件
        // 对于项目内的文件，如果不是包内文件，直接访问可能受限。
        // 然而，dictionaries.json 是项目文件，require 应该能处理。
        // 鉴于 require 行为异常，我们先尝试一种更明确的 require 路径，如果不行再换 FileSystemManager
        // 错误提示是 module 'database/dictionaries.json.js' is not defined, require args is '../../database/dictionaries.json'
        // 这说明 require 本身找到了路径，但解析时出了问题。
        // 微信小程序中，require JSON 文件通常是直接支持的。
        // 尝试清除缓存或重启开发者工具可能解决此类问题。
        // 暂时保持 require，但添加更详细的错误日志。

        // 回退到 require，但确保路径正确性，并添加更详细的日志
        const relativePath = '../../database/dictionaries.js'; // 更新路径为 .js 文件
        console.log(`尝试通过 require 加载: ${relativePath}`);
        const allDictionariesData = require('../../database/dictionaries.js'); // 更新 require 路径
        console.log('dictionaries.js 加载结果:', allDictionariesData);

        // 当使用 module.exports 导出时，allDictionariesData 本身就是那个对象
        if (allDictionariesData && allDictionariesData.dictionaries) {
          dictionariesConfig = allDictionariesData.dictionaries;
        } else {
          console.error('无法加载或解析 dictionaries.js，或者 dictionaries 属性不存在，内容:', allDictionariesData);
          wx.showModal({ title: '错误', content: '词典配置文件缺失或格式错误。', showCancel: false, success: () => wx.navigateBack() });
          return;
        }
      } catch (e) {
        console.error('加载 dictionaries.js 失败 (通过 require):', e);
        wx.showModal({ title: '错误', content: `加载词典配置失败: ${e.message}`.substring(0, 100), showCancel: false, success: () => wx.navigateBack() });
        return;
      }

      // 根据用户要求，当前只测试 duolingguo
      const targetDictionaryIdForTesting = 'duolingguo';

      if (lessonFile === 'ALL_DICTIONARIES_ALL_LESSONS') {
        // 用户要求：即使选择“全部辞典”，也只加载 duolingguo 进行测试
        const dictToTest = dictionariesConfig.find(d => d.id === targetDictionaryIdForTesting);
        if (dictToTest && dictToTest.lesson_files && dictToTest.lesson_files.length > 0) {
          // lesson_files 在 dictionaries.json 中是类似 "duolingguo/lesson*.json" 的模式
          // 我们需要一种方法来解析这个模式并找到实际的文件名
          // 暂时假设 lesson_files 直接包含文件名，如 ["lesson1.json"]
          // 或者，如果 dictionaries.json 结构更新为直接包含 lessons 数组，则用那个
          // 当前的 dictionaries.json 结构是 "lesson_files": ["duolingguo/lesson*.json"]
          // 这暗示了需要更复杂的逻辑来列出文件，小程序端 require 不支持通配符
          // 根据当前项目结构和用户测试要求，我们明确知道 duolingguo 词典的课程文件。
          // 未来如果需要完全动态加载，需要调整 dictionaries.json 的结构或引入构建步骤。
          // 目前，我们直接使用已知的 duolingguo 课程文件列表。
          const duolingguoLessons = ['lesson1.js']; // 更新为 .js 文件
          duolingguoLessons.forEach(lessonFileName => {
            try {
              // 词典的 base_path 应该直接是其 id，因为资源文件放在与 id 同名的目录下
              const lessonData = require(`../../database/${dictToTest.id}/${lessonFileName}`); // lessonFileName 本身已包含 .js 后缀
              if (lessonData && Array.isArray(lessonData)) {
                wordsToLoad.push(...lessonData.map(item => ({ data: item.data, sourceDictionary: dictToTest.id, lesson: lessonFileName.replace('.json', '') })));
              }
            } catch (e) {
              console.warn(`加载词典 ${dictToTest.name} 的 ${lessonFileName} 失败:`, e);
            }
          });
        } else {
            console.warn('测试词典 duolingguo 未找到或没有课程文件配置');
        }
      } else if (lessonFile.startsWith('DICTIONARY_') && lessonFile.endsWith('_ALL_LESSONS')) {
        // 加载特定词典的所有课程
        // 根据用户要求，这里也应该只处理 duolingguo
        if (dictionaryId === targetDictionaryIdForTesting) {
            const targetDictionary = dictionariesConfig.find(d => d.id === dictionaryId);
            if (targetDictionary && targetDictionary.base_path) {
                // 根据当前项目结构和用户测试要求，我们明确知道 duolingguo 词典的课程文件。
                const duolingguoLessons = ['lesson1.js']; // 更新为 .js 文件
                duolingguoLessons.forEach(lessonFileName => {
                    try {
                        // 词典的 base_path 应该直接是其 id，因为资源文件放在与 id 同名的目录下
                        const lessonData = require(`../../database/${targetDictionary.id}/${lessonFileName}`); // lessonFileName 本身已包含 .js 后缀
                        if (lessonData && Array.isArray(lessonData)) {
                            wordsToLoad.push(...lessonData.map(item => ({ data: item.data, sourceDictionary: targetDictionary.id, lesson: lessonFileName.replace('.json', '') })));
                        }
                    } catch (e) {
                        console.warn(`加载词典 ${targetDictionary.name} 的 ${lessonFileName} 失败:`, e);
                    }
                });
            } else {
                console.error('未找到指定测试词典ID或该词典没有课程:', dictionaryId);
            }
        } else {
            console.log(`当前测试仅支持 ${targetDictionaryIdForTesting}，请求的词典 ${dictionaryId} 将被忽略。`);
            // 可以选择显示一个提示，或者不加载任何内容
        }
      } else {
        // 加载单个课程文件 (旧逻辑，目前不太可能走到)
        console.log('尝试加载单个课程文件 (此路径通常不应被触发):', lessonFile);
        try {
            const lessonData = require(lessonFile); 
            if (lessonData && Array.isArray(lessonData)) {
                wordsToLoad.push(...lessonData.map(item => ({ data: item.data })));
            }
        } catch (e) {
            console.error(`加载单个课程文件 ${lessonFile} 失败:`, e);
        }
      }

      if (wordsToLoad.length === 0) {
        wx.showModal({
          title: '提示',
          content: '选定范围内没有找到任何单词，请检查课程文件或选择其他范围。',
          showCancel: false,
          confirmText: '返回',
          success: () => wx.navigateBack()
        });
        this.setData({ isLoading: false, allWordsInLesson: [], questions: [] });
        return;
      }

      this.setData({ allWordsInLesson: wordsToLoad, isLoading: false });
      const questions = this.selectWordsForQuiz(wordsToLoad, this.data.quizMode);
      this.setData({ questions: questions });

      if (this.data.quizMode === 'quick') {
        const total = Math.min(wordsToLoad.length, 30);
        this.setData({ totalQuestions: total });
        if (questions.length < total && questions.length > 0) {
          this.setData({ totalQuestions: questions.length });
        }
      } else {
        this.setData({ totalQuestions: questions.length });
      }

      if (questions.length === 0 && wordsToLoad.length > 0) {
        wx.showToast({ title: '无法生成题目', icon: 'none', duration: 2000 });
      } else if (questions.length === 0 && wordsToLoad.length === 0) {
        // 这个情况已在前面处理
      }
      this.startTimer(); // 题目加载完毕，启动计时器

    } catch (e) {
      console.error('加载单词和题目数据失败:', e);
      wx.showModal({
        title: '加载失败',
        content: '加载题目数据时发生错误，请稍后重试或检查课程文件。错误：' + e.message,
        showCancel: false,
        confirmText: '返回',
        success: () => wx.navigateBack()
      });
      this.setData({ isLoading: false, allWordsInLesson: [], questions: [] });
    }
  },

  // 根据模式选择题目 (示例)
  selectWordsForQuiz(allWords, mode) {
    let selected = [];
    if (mode === 'quick') {
      // 随机选择30题
      selected = allWords.sort(() => 0.5 - Math.random()).slice(0, 30);
    } else {
      // 无尽模式，可以考虑打乱顺序或按特定逻辑
      selected = allWords.sort(() => 0.5 - Math.random());
    }
    return selected.map(word => this.formatQuestion(word, allWords)); // 传递allWords用于生成选项
  },

  // 格式化单个单词为题目对象 (示例)
  formatQuestion(wordData) { // allWords 将从 this.data.allWordsInLesson 获取
    // 随机决定是选择题还是填空题
    const questionType = Math.random() > 0.5 ? 'choice' : 'fill';
    let question = {
      id: wordData.data.汉字 || wordData.data.假名, // 唯一标识
      type: questionType,
      stem: '', // 题干
      answer: wordData.data.中文, // 正确答案
      options: [], // 选择题选项 (如果适用)
      wordInfo: wordData.data // 原始单词信息，用于显示答案详情
    };

    if (questionType === 'choice') {
      // 生成选择题题干和选项
      // 题干可以是 假名问中文，或者中文问假名/汉字
      if (Math.random() > 0.5 && wordData.data.假名) {
        question.stem = `「${wordData.data.假名}」的中文意思是什么？`;
        question.answer = wordData.data.中文;
      } else {
        question.stem = `「${wordData.data.中文}」的假名或汉字是什么？`;
        question.answer = wordData.data.汉字 || wordData.data.假名;
      }
      let optionType = question.stem.includes('中文意思是什么？') ? 'chinese' : 'japanese';
      question.options = this.generateOptions(wordData.data, optionType);
    } else {
      // 生成填空题题干
      // 可以是 给出假名填中文，或者给出中文填假名/汉字
      if (Math.random() > 0.5 && wordData.data.假名) {
        question.stem = `「${wordData.data.假名}」的中文意思是什么？(填空)`;
        question.answer = wordData.data.中文;
      } else {
        question.stem = `「${wordData.data.中文}」的假名或汉字是什么？(填空)`;
        question.answer = wordData.data.汉字 || wordData.data.假名;
      }
    }
    return question;
  },

  // 生成选择题选项 (示例)
  generateOptions(correctWord, optionType) {
    const allWordsInLesson = this.data.allWordsInLesson; // 使用当前课程的单词列表
    let correctAnswerText = '';
    if (optionType === 'chinese') {
        correctAnswerText = correctWord.中文;
    } else { // japanese
        correctAnswerText = correctWord.汉字 || correctWord.假名;
    }

    let options = [correctAnswerText];
    const distractorsPool = allWordsInLesson.filter(w => {
        const wData = w.data;
        if (optionType === 'chinese') {
            return wData.中文 !== correctAnswerText && wData.中文; //确保干扰项也有中文
        } else { // japanese
            return (wData.汉字 || wData.假名) !== correctAnswerText && (wData.汉字 || wData.假名);
        }
    });

    while (options.length < 4 && distractorsPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * distractorsPool.length);
      const distractorWord = distractorsPool.splice(randomIndex, 1)[0].data;
      let distractorText = '';
      if (optionType === 'chinese') {
        distractorText = distractorWord.中文;
      } else { // japanese
        distractorText = distractorWord.汉字 || distractorWord.假名;
      }
      if (distractorText && !options.includes(distractorText)) {
        options.push(distractorText);
      }
    }
    // 如果选项不足4个（例如课程单词太少），可以考虑用固定占位符或减少选项数量
    // 这里简单处理，如果不足4个，就只有这些选项

    return options.sort(() => 0.5 - Math.random()); // 打乱选项顺序
  },

  // 处理用户答案输入
  handleAnswerInput(e) {
    this.setData({ userAnswer: e.detail.value });
  },

  // 选择题：处理选项点击
  onOptionSelect(e) {
    const selected = e.currentTarget.dataset.option;
    this.setData({ 
      userAnswer: selected, // 将选择的选项作为答案
      selectedOption: selected // 用于高亮显示
    });
  },

  // 提交答案
  submitAnswer() {
    const currentQ = this.data.questions[this.data.currentQuestionIndex];
    let isCorrect = false;
    if (currentQ.type === 'choice') {
      isCorrect = this.data.userAnswer === currentQ.answer;
    } else { // fill
      // 填空题答案可能需要更宽松的比较，例如忽略大小写、空格等，或允许多个正确答案
      isCorrect = this.data.userAnswer.trim() === currentQ.answer.trim();
    }

    this.setData({
      isCorrect: isCorrect,
      showAnswerCard: true // 显示答案反馈卡片
    });

    if (isCorrect) {
      this.setData({ score: this.data.score + 1 });
    } else {
      // TODO: 将错题加入错题本 (可以存储到本地缓存)
      // this.addMistake(currentQ);
    }

    // 延时一段时间后进入下一题或结束
    setTimeout(() => {
      this.setData({ showAnswerCard: false, selectedOption: null }); // 隐藏答案卡片，重置选项
      this.nextQuestion();
    }, 2500); // 稍微加长一点时间看答案
  },

  // 下一题
  nextQuestion() {
    if (this.data.quizMode === 'quick' && this.data.currentQuestionIndex >= this.data.totalQuestions - 1) {
      this.endQuiz();
    } else if (this.data.currentQuestionIndex >= this.data.questions.length - 1 && this.data.quizMode === 'endless'){
      // 无尽模式下如果题目答完，可以考虑重新加载或提示
      wx.showToast({title: '你已完成所有题目！将重新开始。', icon: 'none'});
      this.setData({ currentQuestionIndex: 0, score: 0}); // 简单处理：回到第一题
      // 或者 this.loadQuestions(); 重新加载打乱
    } else {
      this.setData({
        currentQuestionIndex: this.data.currentQuestionIndex + 1,
        userAnswer: '', // 清空上一题答案
        selectedOption: null, // 清空选择题选项高亮
        showAnswerCard: false // 确保答案卡隐藏
      });
    }
  },

  // 结束答题
  endQuiz() {
    clearInterval(this.data.timer);
    // TODO: 显示答题结果页面，包括得分、正确率、用时等
    wx.showModal({
      title: '答题结束',
      content: `模式：${this.data.quizMode}\n得分：${this.data.score}\n总题数：${this.data.quizMode === 'quick' ? this.data.totalQuestions : this.data.currentQuestionIndex +1 }\n用时：${this.formatTime(this.data.timeSpent)}`,
      showCancel: false,
      confirmText: '返回',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 开始计时器
  startTimer() {
    this.data.timer = setInterval(() => {
      this.setData({ timeSpent: this.data.timeSpent + 1 });
    }, 1000);
  },

  // 格式化时间 (秒 -> HH:MM:SS)
  formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    clearInterval(this.data.timer); // 页面卸载时清除计时器
  }
})