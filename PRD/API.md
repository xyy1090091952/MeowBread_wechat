# MeowBread 小程序接口文档

本文档旨在为 MeowBread 小程序的开发者提供清晰的模块接口说明，以便于团队协作和后续的功能扩展。文档主要涵盖了 `utils` 目录下的核心模块，这些模块构成了应用的主要业务逻辑和数据管理层。

## 设计理念

项目遵循分层架构的设计思想，将不同职责的代码进行分离，主要分为以下几层：

- **页面层 (Pages)**: 负责 UI 的渲染和用户的事件响应，是应用的最外层。
- **服务层 (Service)**: 负责处理复杂的业务逻辑，作为页面层和数据管理层之间的桥梁。例如 `quiz.service.js` 和 `filter.service.js`。
- **管理层 (Manager)**: 负责特定领域的数据持久化和状态管理，直接与微信小程序的本地存储 API (`wx.setStorageSync`, `wx.getStorageSync`) 交互。例如 `filterManager.js` 和 `mistakeManager.js`。
- **工具层 (Utils)**: 提供无状态、可复用的辅助函数，通常是原子化的操作。例如 `quizUtils.js`。
- **数据层 (Database)**: 存放静态的单词数据。

---

## 模块详解

### 1. 全局常量 (`utils/constants.js`)

该模块定义了整个应用中需要统一使用的常量，以保证代码的一致性和可维护性。

#### `WORD_STATUS`

定义了单词的学习状态。

- `UNSEEN`: `'unseen'` - 未学习
- `ERROR`: `'error'` - 答错
- `CORRECTED`: `'corrected'` - 已修正
- `MEMORIZED`: `'memorized'` - 已掌握

#### `QUESTION_TYPES`

定义了所有支持的题目类型。

- `ZH_TO_JP_CHOICE`: `'zh_to_jp_choice'` - 中文选日文（选择题）
- `JP_TO_ZH_CHOICE`: `'jp_to_zh_choice'` - 日文选中文（选择题）
- `ZH_TO_JP_FILL`: `'zh_to_jp_fill'` - 中文填日文（填空题）
- `JP_KANJI_TO_KANA_FILL`: `'jp_kanji_to_kana_fill'` - 日文汉字填假名（填空题）

---

### 2. 筛选条件管理器 (`utils/filterManager.js`)

负责筛选条件的本地持久化存储。

#### `getFilter()`

- **描述**: 从本地缓存中获取已保存的筛选条件。
- **参数**: 无
- **返回**: `Object | null` - 保存的筛选条件对象，若不存在则返回 `null`。

#### `saveFilter(filterSettings)`

- **描述**: 将筛选条件保存到本地缓存。
- **参数**:
  - `filterSettings` (Object): 需要保存的筛选条件对象。
- **返回**: 无

#### `clearFilter()`

- **描述**: 清除本地缓存中的筛选条件。
- **参数**: 无
- **返回**: 无

---

### 3. 错题本管理器 (`utils/mistakeManager.js`)

管理用户的错题记录。

#### `getMistakeList()`

- **描述**: 获取完整的错题列表。
- **参数**: 无
- **返回**: `Array` - 错题列表。

#### `addMistake(wordInfo)`

- **描述**: 将一个单词添加到错题库（如果尚未存在）。
- **参数**:
  - `wordInfo` (Object): 完整的单词信息对象。
- **返回**: 无

#### `correctMistake(wordInfo)`

- **描述**: 将一个错题的状态更新为“已修正”。
- **参数**:
  - `wordInfo` (Object): 完整的单词信息对象。
- **返回**: 无

#### `clearCorrectedMistakes()`

- **描述**: 从错题库中移除所有状态为 `CORRECTED` 或 `MEMORIZED` 的单词。
- **参数**: 无
- **返回**: `number` - 被移除的单词数量。

---

### 4. 单词数据管理器 (`utils/wordManager.js`)

根据筛选条件从数据库中加载单词数据。

#### `getWordsByFilter(filter)`

- **描述**: 根据指定的筛选条件获取单词列表。
- **参数**:
  - `filter` (Object): 筛选条件，包含 `lessonFiles` (Array) 和 `dictionaryId` (String) 等。
- **返回**: `Array` - 包含单词对象的数组，每个对象都增加了 `sourceDictionary` 和 `lesson` 字段。

---

### 5. 筛选页面服务层 (`utils/filter.service.js`)

处理筛选页面的所有业务逻辑。

#### `initializeFilterState(options)`

- **描述**: 初始化筛选页面的状态，会结合本地缓存和页面启动参数。
- **参数**:
  - `options` (Object): 页面的 `onLoad` 启动参数。
- **返回**: `Object` - 用于页面 `setData` 的初始状态对象。

#### `getLessonsForDictionary(dictionary, selectedLessonFiles)`

- **描述**: 根据所选的词典，生成其下的课程列表。
- **参数**:
  - `dictionary` (Object): 当前选中的词典对象。
  - `selectedLessonFiles` (Array): 当前已选中的课程文件列表。
- **返回**: `Array` - 格式化后的课程列表，包含了选中状态。

#### `handleLessonCheckboxChange(lessons, clickedFile)`

- **描述**: 处理课程复选框的点击事件，处理“全部课程”与其他课程之间的联动逻辑。
- **参数**:
  - `lessons` (Array): 当前的课程列表。
  - `clickedFile` (String): 被点击的课程文件标识。
- **返回**: `Object` - 包含更新后的 `lessons` 数组和 `selectedLessonFiles` 数组。

#### `saveFilterSettings(data)`

- **描述**: 组合页面当前数据，调用 `filterManager.saveFilter` 保存筛选设置。
- **参数**:
  - `data` (Object): 页面当前的 `data` 对象。
- **返回**: 无

---

### 6. 答题页面服务层 (`utils/quiz.service.js`)

作为答题引擎，驱动整个答题流程。

#### `initializeQuiz(options)`

- **描述**: 初始化测验，包括加载单词、生成题目等。支持从普通模式和错题重练模式启动。
- **参数**:
  - `options` (Object): 页面的 `onLoad` 启动参数，可能包含 `from`, `words`, `mode` 等。
- **返回**: `Object` - 用于 `quiz` 页面 `setData` 的初始状态对象。

#### `generateQuestions(allWords, questionTypes)`

- **描述**: 根据给定的单词列表和题型，生成一个打乱顺序的问题列表。
- **参数**:
  - `allWords` (Array): 单词信息对象的数组。
  - `questionTypes` (Array): 需要生成的题型数组。
- **返回**: `Array` - 生成的问题对象数组。

#### `selectWordsForQuiz(allWords, mode, selectedQuestionTypes)`

- **描述**: 根据测验模式（快速或无尽）和题型选择单词并生成问题。
- **参数**:
  - `allWords` (Array): 所有备选单词的数组。
  - `mode` (String): `'quick'` 或 `'endless'`。
  - `selectedQuestionTypes` (Array): 选择的题型。
- **返回**: `Array` - 最终的问题列表。

#### `checkAnswer(currentQuestion, userAnswer)`

- **描述**: 校验用户答案是否正确。
- **参数**:
  - `currentQuestion` (Object): 当前的题目对象。
  - `userAnswer` (String): 用户的答案。
- **返回**: `boolean` - 答案是否正确。

#### `getHighlightedSentence(sentence, highlight)`

- **描述**: 根据需要高亮例句中的助词。
- **参数**:
  - `sentence` (String): 原始例句。
  - `highlight` (boolean): 是否需要高亮。
- **返回**: `String` - 处理后的例句（可能包含 HTML 标签）。

#### `formatTime(seconds)`

- **描述**: 将秒数格式化为 `MM:SS` 的字符串。
- **参数**:
  - `seconds` (number): 总秒数。
- **返回**: `String` - 格式化后的时间字符串。

---

### 7. 答题工具函数 (`utils/quizUtils.js`)

提供答题相关的、可复用的、无状态的辅助函数。

#### `formatQuestion(wordData, questionTypeToGenerate, allWordsInLesson)`

- **描述**: 将单个单词根据指定题型格式化为完整的题目对象。
- **参数**:
  - `wordData` (Object): 单个单词的信息对象。
  - `questionTypeToGenerate` (String): 要生成的题型。
  - `allWordsInLesson` (Array): 整个单词池，用于生成选择题的干扰项。
- **返回**: `Object | null` - 格式化后的题目对象，如果无法生成则返回 `null`。

#### `generateOptions(correctWordData, optionType, allWordsInLesson)`

- **描述**: 为选择题生成选项列表（1个正确答案 + 3个干扰项）。
- **参数**:
  - `correctWordData` (Object): 正确答案的单词对象。
  - `optionType` (String): `'japanese'` 或 `'chinese'`，决定选项的语言。
  - `allWordsInLesson` (Array): 用于生成干扰项的单词池。
- **返回**: `Array` - 包含四个选项的随机排序数组。