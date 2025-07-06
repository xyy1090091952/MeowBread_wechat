// 梁老师课程信息数据包
// 包含课程编号、课程标题和对应的lesson文件名
module.exports = {
  // 课程基本信息
  textbook: "liangs_class",
  textbookName: "梁老师的日语课",
  
  // 课程列表
  courses: [
    {
      courseNumber: 5,
      courseTitle: "初対面",
      lessonFile: "lesson5",
      description: "初次见面的日语表达"
    },
    {
      courseNumber: 6,
      courseTitle: "Wi-Fiはありますか",
      lessonFile: "lesson6",
      description: "询问Wi-Fi等基本设施"
    },
    {
      courseNumber: 7,
      courseTitle: "スマホに写真がありますよ",
      lessonFile: "lesson7",
      description: "谈论手机和照片"
    },
    {
      courseNumber: 8,
      courseTitle: "S サイズでお願いします",
      lessonFile: "lesson8",
      description: "购物时的尺寸选择"
    },
    {
      courseNumber: 9,
      courseTitle: "誕⽣⽇と性格",
      lessonFile: "lesson9",
      description: "生日和性格的表达"
    },
    {
      courseNumber: 10,
      courseTitle: "映画の約束",
      lessonFile: "lesson10",
      description: "电影约会的安排"
    },
    {
      courseNumber: 11,
      courseTitle: "電気屋さんで",
      lessonFile: "lesson11",
      description: "在电器店购物"
    },
    {
      courseNumber: 12,
      courseTitle: "漫画ファン",
      lessonFile: "lesson12",
      description: "漫画爱好者的对话"
    },
    {
      courseNumber: 13,
      courseTitle: "忘れ物",
      lessonFile: "lesson13",
      description: "遗忘物品的处理"
    },
    {
      courseNumber: 14,
      courseTitle: "勉強スケジュール",
      lessonFile: "lesson14",
      description: "学习计划的制定"
    },
    {
      courseNumber: 15,
      courseTitle: "試験勉強",
      lessonFile: "lesson15",
      description: "考试复习的准备"
    },
    {
      courseNumber: 16,
      courseTitle: "村上夏樹先生の講演会",
      lessonFile: "lesson16",
      description: "村上夏树先生的讲演会"
    },
    {
      courseNumber: 17,
      courseTitle: "アンケート",
      lessonFile: "lesson17",
      description: "问卷调查的填写"
    },
    {
      courseNumber: 18,
      courseTitle: "妹からアドバイスをもらいました",
      lessonFile: "lesson18",
      description: "从妹妹那里得到建议"
    },
    {
      courseNumber: 19,
      courseTitle: "夏休の過ごし方",
      lessonFile: "lesson19",
      description: "暑假的度过方式"
    },
    {
      courseNumber: 20,
      courseTitle: "ネットで口コミ情報をチェック",
      lessonFile: "lesson20",
      description: "网上口碑信息的查看"
    },
    {
      courseNumber: 21,
      courseTitle: "返さなくてもいいんですか",
      lessonFile: "lesson21",
      description: "不用归还也可以吗"
    },
    {
      courseNumber: 22,
      courseTitle: "チームワークが⼀番です",
      lessonFile: "lesson22",
      description: "团队合作最重要"
    },
    {
      courseNumber: 23,
      courseTitle: "グループ作業",
      lessonFile: "lesson23",
      description: "小组作业的进行"
    },
    {
      courseNumber: 24,
      courseTitle: "日本の弁当文化",
      lessonFile: "lesson24",
      description: "日本的便当文化"
    },
    {
      courseNumber: 25,
      courseTitle: "综合练习",
      lessonFile: "lesson25",
      description: "综合练习和复习"
    }
  ],
  
  // 根据课程编号获取课程信息
  getCourseInfo: function(courseNumber) {
    return this.courses.find(course => course.courseNumber === courseNumber);
  },
  
  // 根据lesson文件名获取课程信息
  getCourseByLessonFile: function(lessonFile) {
    return this.courses.find(course => course.lessonFile === lessonFile);
  },
  
  // 获取所有课程编号
  getAllCourseNumbers: function() {
    return this.courses.map(course => course.courseNumber);
  },
  
  // 获取课程总数
  getTotalCourses: function() {
    return this.courses.length;
  }
}; 