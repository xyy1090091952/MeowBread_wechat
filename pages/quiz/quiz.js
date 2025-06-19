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
    // 获取题型选择，如果不存在则使用默认（全部）
    const selectedQuestionTypes = quizFilter.selectedQuestionTypes || ['zh_to_jp_choice', 'jp_to_zh_choice', 'zh_to_jp_fill', 'jp_kanji_to_kana_fill'];

    this.setData({
      quizMode: quizMode,
      lessonFile: lessonFile,
      dictionaryId: dictionaryId,
      basePath: basePath,
      isLoading: true,
      currentFilterDisplay: currentFilterDisplay, // 用于在WXML中显示
      selectedQuestionTypes: selectedQuestionTypes, // 保存题型选择
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
        // 直接导入JS模块代替读取JSON文件（数据库已迁移为JS格式）
        dictionariesConfig = require('../../database/dictionaries.js'); // 直接赋值给已声明的变量
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

  // 根据模式和选定的题型选择题目
  selectWordsForQuiz: function(allWords, mode) {
    const { selectedQuestionTypes } = this.data;
    let finalQuestions = [];
    // 如果没有选择任何题型，或者没有单词，则直接返回空数组
    if (!selectedQuestionTypes || selectedQuestionTypes.length === 0 || !allWords || allWords.length === 0) {
      console.warn('没有选择题型或没有单词数据，无法生成题目。');
      return [];
    }

    // 1. 复制并打乱原始单词数组的顺序，确保每次测验的单词顺序不同，且不修改原始 allWordsInLesson
    let shuffledWords = [...allWords].sort(() => 0.5 - Math.random());

    // 2. 遍历打乱后的单词，为每个单词只生成一个题目
    shuffledWords.forEach(word => {
      // 从用户选择的题型中随机选择一个
      const randomTypeIndex = Math.floor(Math.random() * selectedQuestionTypes.length);
      const randomQuestionType = selectedQuestionTypes[randomTypeIndex];

      // 尝试用选定的随机题型为当前单词生成题目
      const question = this.formatQuestion(word, randomQuestionType);
      if (question) {
        finalQuestions.push(question);
      }
    });

    // 如果经过上述处理后，仍然没有生成任何题目（例如所有单词都不适用于随机选出的题型）
    if (finalQuestions.length === 0) {
      console.warn('根据当前筛选条件和随机选择的题型组合，未能为任何单词生成有效题目。');
      // 可以尝试为每个单词遍历所有可选类型，直到成功生成一个，但这会更复杂
      // 目前的逻辑是：随机选一个类型，不行就算了。如果希望每个单词必出一题（只要有可选类型能出），则需要调整。
      // 为了简单起见，暂时保持当前逻辑。如果需要更强的“必出”逻辑，可以后续优化。
      return [];
    }

    // 3. 根据模式选择题目数量
    // 注意：此时 finalQuestions 中的题目已经是每个单词最多一道题了
    // 如果需要，可以再次打乱 finalQuestions 的顺序，确保题目出现的顺序也是随机的
    finalQuestions.sort(() => 0.5 - Math.random());

    if (mode === 'quick') {
      return finalQuestions.slice(0, Math.min(finalQuestions.length, 30));
    } else { // endless 模式
      return finalQuestions; // 无尽模式使用所有生成的题目
    }
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

  // 为单个单词格式化成特定类型的题目
  formatQuestion: function(wordData, questionTypeToGenerate) {
    const word = wordData.data; // 原始单词数据，例如 { '汉字': '単語', '假名': 'たんご', '中文': '单词', '词性': '名词', ... }
    if (!word || !word.中文 || (!word.汉字 && !word.假名)) {
      console.warn('formatQuestion: 无效的单词数据或缺少必要字段:', wordData);
      return null;
    }

    let questionText = '';
    let correctAnswer = '';
    let options = [];
    let actualQuestionType = ''; // 'choice' 或 'fill'
    let wordToDisplay = '';
    let stemRemainder = '';

    const japaneseForm = word.汉字 || word.假名;
    const chineseMeaning = word.中文;

    switch (questionTypeToGenerate) {
      case 'zh_to_jp_choice': // 根据中文意思选日语（4选1）
        questionText = `「${chineseMeaning}」的日语是什么？`;
        correctAnswer = japaneseForm;
        actualQuestionType = 'choice';
        options = this.generateOptions(word, 'japanese'); // 传入原始 word 对象
        wordToDisplay = `「${chineseMeaning}」`;
        stemRemainder = '的日语是什么？';
        break;
      case 'jp_to_zh_choice': // 根据日语选中文（4选1）
        questionText = `「${japaneseForm}」的中文意思是什么？`;
        correctAnswer = chineseMeaning;
        actualQuestionType = 'choice';
        options = this.generateOptions(word, 'chinese'); // 传入原始 word 对象
        wordToDisplay = `「${japaneseForm}」`;
        stemRemainder = '的中文意思是什么？';
        break;
      case 'zh_to_jp_fill': // 根据中文意思写日语
        questionText = `「${chineseMeaning}」的日语是？(可填汉字或假名)`;
        correctAnswer = { word: word.汉字, kana: word.假名 }; // 答案包含汉字和假名，校验时两者皆可
        actualQuestionType = 'fill';
        wordToDisplay = `「${chineseMeaning}」`;
        stemRemainder = '的日语是？(可填汉字或假名)';
        break;
      case 'jp_kanji_to_kana_fill': // 根据日文汉字写假名（单词这两个字段不为空）
        if (word.汉字 && word.假名 && word.汉字 !== word.假名) {
          questionText = `「${word.汉字}」的假名是？`;
          correctAnswer = word.假名;
          actualQuestionType = 'fill';
          wordToDisplay = `「${word.汉字}」`;
          stemRemainder = '的假名是？';
        } else {
          return null; // 不符合出题条件
        }
        break;
      default:
        console.warn(`formatQuestion: 未知的题型请求 '${questionTypeToGenerate}'`);
        return null;
    }

    if (actualQuestionType === 'choice' && (!options || options.length === 0)) {
      console.warn(`无法为单词 '${japaneseForm}' 生成 '${questionTypeToGenerate}' 的选项。`);
      return null;
    }

    return {
      id: japaneseForm + '_' + questionTypeToGenerate, // 确保题目ID的唯一性
      type: actualQuestionType, // 'choice' or 'fill'
      wordToDisplay: wordToDisplay,
      stemRemainder: stemRemainder,
      answer: correctAnswer,
      options: options,
      wordInfo: word, // 原始单词信息
      partOfSpeech: this.mapPartOfSpeechToClassName(word.词性 || ''),
      specificQuestionType: questionTypeToGenerate // 保存具体的生成题型，方便调试或特定逻辑
    };
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
    const userAnswerTrimmed = this.data.userAnswer.trim();

    if (currentQ.type === 'choice') {
      isCorrect = userAnswerTrimmed === currentQ.answer;
    } else { // fill
      const correctAnswerData = currentQ.answer; // 对于填空题，answer现在是一个对象 {word, kana} 或 字符串
      if (typeof correctAnswerData === 'object' && correctAnswerData !== null && correctAnswerData.hasOwnProperty('word')) {
        // 对应 zh_to_jp_fill: 答案是 { word: '汉字', kana: '假名' }
        isCorrect = (userAnswerTrimmed === correctAnswerData.word) || 
                    (correctAnswerData.kana && userAnswerTrimmed === correctAnswerData.kana);
      } else if (typeof correctAnswerData === 'string') {
        // 对应 jp_kanji_to_kana_fill: 答案是假名字符串
        isCorrect = userAnswerTrimmed === correctAnswerData;
      } else {
        // Fallback or error for unexpected answer format
        console.error("未知答案格式: ", correctAnswerData);
        isCorrect = userAnswerTrimmed === correctAnswerData; // 尝试按字符串比较
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