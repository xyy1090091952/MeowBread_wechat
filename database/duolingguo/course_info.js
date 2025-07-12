// 多邻国课程信息数据包
// 基础版本，不分册
module.exports = {
  // 课程基本信息
  textbook: "duolingguo",
  textbookName: "多邻国日语",
  
  // 课程分册信息 - 不分册，作为一个整册
  volumes: [
    {
      volumeKey: "complete",
      volumeName: "完整版",
      description: "多邻国日语完整课程",
      courseRange: [1, 5], // 根据实际文件调整
      courses: []
    }
  ],
  
  // 课程列表
  courses: [
    {
      courseNumber: 1,
      courseTitle: "基础课程1",
      lessonFile: "lesson1",
      description: "日语入门基础"
    },
    {
      courseNumber: 2,
      courseTitle: "基础课程2", 
      lessonFile: "lesson2",
      description: "日语基础进阶"
    },
    {
      courseNumber: 3,
      courseTitle: "基础课程3",
      lessonFile: "lesson3", 
      description: "日语基础提高"
    },
    {
      courseNumber: 5,
      courseTitle: "基础课程5",
      lessonFile: "lesson5",
      description: "日语基础综合"
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
  },

  // 初始化分册课程数据
  initializeVolumes: function() {
    this.volumes.forEach(volume => {
      volume.courses = this.courses.filter(course => 
        course.courseNumber >= volume.courseRange[0] && 
        course.courseNumber <= volume.courseRange[1]
      );
    });
  },

  // 获取所有分册信息
  getVolumes: function() {
    if (this.volumes[0].courses.length === 0) {
      this.initializeVolumes();
    }
    return this.volumes;
  },

  // 根据分册key获取分册信息
  getVolumeByKey: function(volumeKey) {
    const volumes = this.getVolumes();
    return volumes.find(volume => volume.volumeKey === volumeKey);
  },

  // 根据课程编号获取所属分册
  getVolumeForCourse: function(courseNumber) {
    const volumes = this.getVolumes();
    return volumes.find(volume => 
      courseNumber >= volume.courseRange[0] && 
      courseNumber <= volume.courseRange[1]
    );
  },

  // 获取指定分册的课程列表
  getCoursesByVolume: function(volumeKey) {
    const volume = this.getVolumeByKey(volumeKey);
    return volume ? volume.courses : [];
  }
}; 