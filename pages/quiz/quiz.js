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
    isUserAnswerEmpty: true, // 用户答案是否为空 (用于填空题按钮状态)
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
  onLoad: function(options) {
    // 尝试从本地存储中获取用户已选择的筛选条件
    let quizFilter = wx.getStorageSync('quizFilter');

    // 如果没有找到已保存的筛选条件 (例如首次进入)
    if (!quizFilter || !quizFilter.selectedLessonFile) {
      console.log('quiz.js: 未找到已保存的筛选条件，将使用默认“全部辞典”范围');
      // 构建一个默认的筛选条件，代表“全部辞典”和“全部课程”
      quizFilter = {
        selectedDictionaryIndex: 0, // 假设“全部辞典”在picker中是第一个
        selectedDictionaryName: '全部辞典',
        selectedLessonFile: 'ALL_DICTIONARIES_ALL_LESSONS', // 特殊标识，代表所有词典的所有课程
        selectedLessonName: '全部课程',
        selectedLessonIndex: 0, // 假设“全部课程”在picker中是第一个
        dictionaryId: 'all', // “全部辞典”的ID
        basePath: 'all',     // “全部辞典”的路径标识
        quizMode: options.mode || 'quick' // 默认或从options获取模式
      };
      // 可以选择是否将这个默认值也存入storage，以便filter页面能正确显示
      // wx.setStorageSync('quizFilter', quizFilter); 
      // 但如果希望filter页总是从用户实际选择开始，则不存
    }

    // 从筛选条件中提取必要信息
    const lessonFile = quizFilter.selectedLessonFile;
    const dictionaryId = quizFilter.dictionaryId;
    const basePath = quizFilter.basePath;
    // 优先使用 options.mode, 然后是 quizFilter.quizMode, 最后是默认值 'quick'
    const quizMode = options.mode || (quizFilter && quizFilter.quizMode) || 'quick';
    const currentFilterDisplay = `${quizFilter.selectedDictionaryName} - ${quizFilter.selectedLessonName}`;

    this.setData({
      quizMode: quizMode,
      lessonFile: lessonFile,
      dictionaryId: dictionaryId,
      basePath: basePath,
      isLoading: true,
      currentFilterDisplay: currentFilterDisplay, // 用于在WXML中显示
      score: 0, // 重置分数
      currentQuestionIndex: 0, // 重置题目索引
      userAnswer: '',
      isUserAnswerEmpty: true,
      selectedOption: null,
      showAnswerCard: false,
      isCorrect: false,
      // totalQuestions 将在题目加载后设置
    });

    if (!lessonFile) {
      wx.showModal({
        title: '错误',
        content: '未指定课程范围，无法开始答题。请先去“题库筛选”页面选择。',
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          // 可以选择跳转到筛选页或首页
          wx.switchTab({
            url: '/pages/answer/answer' // 或者跳转到筛选页所在的tab
          });
        }
      });
      return;
    }
    this.setData({ timeSpent: 0 }); // 初始化/重置用时
    this.loadQuestionsAndWords(); // loadQuestionsAndWords 内部会在题目加载完成后启动计时器
  },

  // 加载单词和题目数据
  loadQuestionsAndWords: function() {
    this.setData({ isLoading: true, timeSpent: 0 }); // 重置加载状态和用时
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

      // 动态加载课程文件逻辑
      const processLessonFile = (dict, lessonFileNamePattern) => {
        // lessonFileNamePattern 可能是 "duolingguo/lesson*.js" 或 "lesson1.js"
        // 我们需要提取纯文件名，并确保它是 .js
        let actualLessonFileName = lessonFileNamePattern;
        if (lessonFileNamePattern.includes('/')) {
          actualLessonFileName = lessonFileNamePattern.split('/').pop();
        }
        // 确保是 .js 文件，如果之前是 .json，则替换
        actualLessonFileName = actualLessonFileName.replace('.json', '.js'); 

        try {
          const lessonData = require(`../../database/${dict.id}/${actualLessonFileName}`);
          if (lessonData && Array.isArray(lessonData)) {
            wordsToLoad.push(...lessonData.map(item => ({ 
              data: item.data, 
              sourceDictionary: dict.id, 
              lesson: actualLessonFileName.replace('.js', '') // 存储不带后缀的课程名
            })));
          }
        } catch (e) {
          console.warn(`加载词典 ${dict.name} 的 ${actualLessonFileName} 失败:`, e);
        }
      };

      if (lessonFile === 'ALL_DICTIONARIES_ALL_LESSONS') {
        // 加载所有词典的所有课程
        dictionariesConfig.forEach(dict => {
          if (dict.lesson_files && Array.isArray(dict.lesson_files)) {
            dict.lesson_files.forEach(lessonPattern => {
              processLessonFile(dict, lessonPattern);
            });
          }
        });
      } else if (lessonFile.startsWith('DICTIONARY_') && lessonFile.endsWith('_ALL_LESSONS')) {
        // 加载特定词典的所有课程
        const targetDictId = dictionaryId; // dictionaryId 应该是从 options 传入的实际词典 ID
        const targetDictionary = dictionariesConfig.find(d => d.id === targetDictId);
        if (targetDictionary && targetDictionary.lesson_files && Array.isArray(targetDictionary.lesson_files)) {
          targetDictionary.lesson_files.forEach(lessonPattern => {
            processLessonFile(targetDictionary, lessonPattern);
          });
        } else {
          console.error(`未找到词典 ${targetDictId} 或其没有课程文件配置。`);
        }
      } else {
        // 加载单个课程文件 (例如 'duolingguo/lesson1.js' 或 'lesson1.js' 如果 basePath 已知)
        // lessonFile 此时应该是类似 'duolingguo_lesson1' 或 'everyones_japanese_lesson31' 的格式
        // 我们需要从中解析出 dictionaryId 和 lessonName
        const parts = lessonFile.split('_'); // 假设格式为 'dictionaryId_lessonName'
        let dictIdToLoad = '';
        let lessonNameToLoad = '';

        if (parts.length >= 2) {
            // 尝试处理像 'everyones_japanese_lesson31' 这样的情况
            // 或者 'duolingguo_lesson1'
            const potentialLessonName = parts.pop(); // e.g., 'lesson31'
            const potentialDictId = parts.join('_'); // e.g., 'everyones_japanese'
            
            const foundDict = dictionariesConfig.find(d => d.id === potentialDictId);
            if (foundDict) {
                dictIdToLoad = potentialDictId;
                // 确保 lessonNameToLoad 包含 .js 后缀
                lessonNameToLoad = potentialLessonName.endsWith('.js') ? potentialLessonName : `${potentialLessonName}.js`;
            } else {
                // 如果不是 'dictId_lessonName' 格式，可能 lessonFile 就是 'lesson1.js' 并且 dictionaryId 已在 data 中
                if (this.data.dictionaryId && this.data.dictionaryId !== 'all') {
                    dictIdToLoad = this.data.dictionaryId;
                    lessonNameToLoad = lessonFile.endsWith('.js') ? lessonFile : `${lessonFile}.js`;
                } else {
                     console.error(`无法从 ${lessonFile} 解析词典ID和课程名，且当前词典ID (${this.data.dictionaryId}) 无效。`);
                }
            }
        }

        if (dictIdToLoad && lessonNameToLoad) {
            const dictForSingleLesson = dictionariesConfig.find(d => d.id === dictIdToLoad);
            if (dictForSingleLesson) {
                console.log(`尝试加载单个课程文件: ${dictIdToLoad}/${lessonNameToLoad}`);
                processLessonFile(dictForSingleLesson, lessonNameToLoad); // lessonNameToLoad 已经包含 .js
            } else {
                console.error(`加载单个课程文件时未找到词典: ${dictIdToLoad}`);
            }
        } else {
             console.error(`无法加载单个课程文件，解析失败: ${lessonFile}`);
        }
      }
      // try 块结束前确保所有逻辑分支都已闭合
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

      // 设置总题数，对于无尽模式，totalQuestions 就是实际生成的题目数量
      // 对于快速模式，totalQuestions 是 questions.length (因为 selectWordsForQuiz 已经处理了上限30)
      this.setData({ totalQuestions: questions.length });

      if (questions.length === 0 && wordsToLoad.length > 0) {
        wx.showToast({ title: '无法生成题目', icon: 'none', duration: 2000 });
      } else if (questions.length === 0 && wordsToLoad.length === 0) {
        // 这个情况已在前面处理
      }
      // 确保在题目数据实际可用后再启动计时器
      if (this.data.questions && this.data.questions.length > 0 && !this.data.timer) {
        this.startTimer();
      }
    } // End of try
    catch (e) { // Start of catch
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

  // 根据模式选择题目
  selectWordsForQuiz: function(allWords, mode) {
    let selected = [];
    if (mode === 'quick') {
      // 快速模式：随机选择最多30题
      selected = allWords.sort(() => 0.5 - Math.random()).slice(0, Math.min(allWords.length, 30));
    } else { // endless 模式
      // 无尽模式：使用所有题目，并打乱顺序
      selected = allWords.sort(() => 0.5 - Math.random());
    }
    // 为选中的单词格式化成题目，不再传递 allWords，因为 formatQuestion 内部会从 this.data 获取
    return selected.map(word => this.formatQuestion(word)); 
  },



  mapPartOfSpeechToClassName: function(partOfSpeech) {
    const mapping = {
      '动词': 'verb',
      '自动词': 'intransitive-verb',
      '他动词': 'transitive-verb',
      '名词': 'noun',
      '形容词': 'adjective',
      '副词': 'adverb',
      '助词': 'particle',
      '连词': 'conjunction',
      '形容动词': 'adjectival-noun',
      '代词': 'pronoun',
      '数词': 'numeral'
      // 可以根据需要添加更多映射
    };
    return mapping[partOfSpeech] || partOfSpeech; // 如果没有匹配，返回原始值或空字符串
  },

  mapClassNameToPartOfSpeech: function(className) {
    const mapping = {
      'verb': '动词',
      'intransitive-verb': '自动词',
      'transitive-verb': '他动词',
      'noun': '名词',
      'adjective': '形容词',
      'adverb': '副词',
      'particle': '助词',
      'conjunction': '连词',
      'adjectival-noun': '形容动词',
      'pronoun': '代词',
      'numeral': '数词'
      // 可以根据需要添加更多映射
    };
    return mapping[className] || className; // 如果没有匹配，返回原始值
  },

  // 格式化单个单词为题目对象 (示例)
  formatQuestion: function(wordData) { // allWords 将从 this.data.allWordsInLesson 获取
    // 随机决定是选择题还是填空题
    const questionType = Math.random() > 0.5 ? 'choice' : 'fill';
    let question = {
      id: wordData.data.汉字 || wordData.data.假名, // 唯一标识
      type: questionType,
      stem: '', // 题干
      answer: '', // 答案将在下面根据类型设置
      options: [], // 选择题选项 (如果适用)
      wordInfo: wordData.data, // 原始单词信息，用于显示答案详情
      partOfSpeech: this.mapPartOfSpeechToClassName(wordData.data.词性) // 添加词性字段并映射到类名
    };

    // 统一答案为单词的日文形式（假名或汉字）或中文意思
    const japaneseForm = wordData.data.汉字 || wordData.data.假名;
    const chineseMeaning = wordData.data.中文;

    if (questionType === 'choice') {
      // 生成选择题题干和选项
      if (Math.random() > 0.5 && wordData.data.假名) { // 给出日文，选择中文
        question.stem = `「${japaneseForm}」的中文意思是什么？`;
        question.answer = chineseMeaning;
        question.options = this.generateOptions(wordData.data, 'chinese');
      } else { // 给出中文，选择日文
        question.stem = `「${chineseMeaning}」的假名或汉字是什么？`;
        question.answer = japaneseForm;
        question.options = this.generateOptions(wordData.data, 'japanese');
      }
    } else { // fill 填空题
      // 填空题统一要求填写“假名”或“汉字”
      question.stem = `「${wordData.data.中文}」的假名或汉字是什么？(填空)`;
      question.answer = japaneseForm; 
      // 填空题的答案验证也需要调整，以接受假名或汉字
    }
    return question;
  },

  // 生成选择题选项 (示例)
  generateOptions: function(correctWord, optionType) {
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
  handleAnswerInput: function(e) {
    console.log('Input event triggered. Value:', e.detail.value); // 打印输入事件和值
    const userAnswer = e.detail.value;
    this.setData({
      userAnswer: userAnswer,
      isUserAnswerEmpty: userAnswer.trim() === '' // 根据输入实时更新答案是否为空的状态
    });
    // console.log('userAnswer after setData:', this.data.userAnswer);
    // console.log('isUserAnswerEmpty after setData:', this.data.isUserAnswerEmpty);
  },

  // 选择题：处理选项点击
  onOptionSelect: function(e) {
    const selected = e.currentTarget.dataset.option;
    this.setData({ 
      userAnswer: selected, // 将选择的选项作为答案
      selectedOption: selected // 用于高亮显示
    });
  },

  // 提交答案
  submitAnswer: function() {
    const currentQ = this.data.questions[this.data.currentQuestionIndex];
    let isCorrect = false;
    if (currentQ.type === 'choice') {
      isCorrect = this.data.userAnswer === currentQ.answer;
    } else { // fill
      // 填空题答案验证：用户输入的答案与问题的标准答案（可能是假名或汉字）一致
      // 或者，如果标准答案是汉字，用户输入了对应的假名也算对；反之亦然（如果都有的话）
      const userAnswerTrimmed = this.data.userAnswer.trim();
      const correctAnswer = currentQ.answer.trim(); // currentQ.answer 现在是日文形式
      const wordInfo = currentQ.wordInfo; // 原始单词信息

      isCorrect = userAnswerTrimmed === correctAnswer;

      // 额外判断：如果答案是汉字，输入假名也算对；如果答案是假名，输入汉字也算对
      if (!isCorrect && wordInfo) {
        if (correctAnswer === wordInfo.汉字 && userAnswerTrimmed === wordInfo.假名) {
          isCorrect = true;
        }
        if (correctAnswer === wordInfo.假名 && userAnswerTrimmed === wordInfo.汉字) {
          isCorrect = true;
        }
      }
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

    // 用户点击“下一题”按钮后才会进入下一题，此处不再自动跳转
    // setTimeout(() => {
    //   this.setData({ showAnswerCard: false, selectedOption: null }); // 隐藏答案卡片，重置选项
    //   this.nextQuestion();
    // }, 2500); 
  },

  // 跳过本题
  skipQuestion: function() {
    // 跳过题目不计分，直接进入下一题
    this.nextQuestion();
  },

  // 下一题
  nextQuestion: function() {
    // 检查是否是快速模式且达到最后一题，或者是无尽模式且达到最后一题
    if ((this.data.quizMode === 'quick' && this.data.currentQuestionIndex >= this.data.totalQuestions - 1) || 
        (this.data.quizMode === 'endless' && this.data.currentQuestionIndex >= this.data.questions.length - 1)) {
      this.endQuiz(); // 两种模式下答完都结束答题
    } else {
      // 进入下一题
      const nextIndex = this.data.currentQuestionIndex + 1;
      this.setData({
        currentQuestionIndex: nextIndex,
        userAnswer: '', // 重置用户答案
        selectedOption: null, // 重置用户选项
        isUserAnswerEmpty: true, // 重置填空题答案为空的状态
        showAnswerCard: false, // 隐藏答案卡片
        isCorrect: false // 重置正确状态
      });
    }
  },

  // 结束答题
  endQuiz: function() {
    this.clearTimer(); // 停止计时器
    // 根据当前的 quizMode 确定显示的模式文本
    let modeText = this.data.quizMode === 'quick' ? '快速答题' : '无尽模式';
    // 在无尽模式下，总题数应该是实际题目数组的长度
    // 在快速答题模式下，totalQuestions 是预设的（最多30或实际题目数，已在loadQuestionsAndWords中设置）
    let displayedTotalQuestions = this.data.quizMode === 'quick' ? this.data.totalQuestions : this.data.questions.length;

    wx.showModal({
      title: '答题结束',
      content: `模式：${modeText}\n得分：${this.data.score}\n总题数：${displayedTotalQuestions}\n用时：${this.formatTime(this.data.timeSpent)}`,
      showCancel: false,
      confirmText: '返回',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  startTimer: function() {
    // 如果计时器已存在，则不再重复启动
    if (this.data.timer) return;

    const timer = setInterval(() => {
      this.setData({
        timeSpent: this.data.timeSpent + 1
      });
    }, 1000);
    this.setData({ timer: timer });
  },

  // 清除计时器
  clearTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null }); // 将timer设置为null，以便下次可以重新启动
    }
  },

  // 格式化时间 (秒 -> HH:MM:SS)
  formatTime: function(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    // 如果页面从后台切回来，且计时器已停止（可能在onHide中停止），并且答题未结束，则重新启动计时器
    if (!this.data.timer && this.data.questions.length > 0 && !this.data.showAnswerCard && this.data.currentQuestionIndex < (this.data.quizMode === 'quick' ? this.data.totalQuestions : this.data.questions.length)) {
      this.startTimer();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    this.clearTimer(); // 页面隐藏时停止计时器，修正函数名
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    this.clearTimer(); // 页面卸载时清除计时器
  },

  // 确保在答题结束或者重新开始答题时也重置和停止计时器
  resetQuizState: function() {
    this.clearTimer();
    this.setData({
      currentQuestionIndex: 0,
      userAnswer: '',
      isUserAnswerEmpty: true,
      selectedOption: null,
      showAnswerCard: false,
      isCorrect: false,
      score: 0,
      timeSpent: 0, // 重置用时
      // questions 和 totalQuestions 通常在 loadQuestionsAndWords 中重置
    });
    // 可能需要重新加载题目或根据逻辑决定下一步
    // this.loadQuestionsAndWords(); 
  }
})