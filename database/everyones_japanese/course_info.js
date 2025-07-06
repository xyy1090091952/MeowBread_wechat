// 大家的日语课程信息数据包
module.exports = {
  // 课程基本信息
  textbook: "everyones_japanese",
  textbookName: "大家的日语",
  
  // 课程分册信息
  volumes: [
    {
      volumeKey: "volume1",
      volumeName: "第一册",
      description: "大家的日语第一册",
      courseRange: [31, 37], // 第31课到第37课
      courses: []
    },
    {
      volumeKey: "volume2", 
      volumeName: "第二册",
      description: "大家的日语第二册",
      courseRange: [38, 45], // 第38课到第45课
      courses: []
    }
  ],
  
  // 课程列表
  courses: [
    {
      courseNumber: 31,
      courseTitle: "第31课",
      lessonFile: "lesson31",
      description: "大家的日语第31课"
    },
    {
      courseNumber: 32,
      courseTitle: "第32课",
      lessonFile: "lesson32",
      description: "大家的日语第32课"
    },
    {
      courseNumber: 33,
      courseTitle: "第33课",
      lessonFile: "lesson33",
      description: "大家的日语第33课"
    },
    {
      courseNumber: 34,
      courseTitle: "第34课",
      lessonFile: "lesson34",
      description: "大家的日语第34课"
    },
    {
      courseNumber: 35,
      courseTitle: "第35课",
      lessonFile: "lesson35",
      description: "大家的日语第35课"
    },
    {
      courseNumber: 36,
      courseTitle: "第36课",
      lessonFile: "lesson36",
      description: "大家的日语第36课"
    },
    {
      courseNumber: 37,
      courseTitle: "第37课",
      lessonFile: "lesson37",
      description: "大家的日语第37课"
    },
    {
      courseNumber: 38,
      courseTitle: "第38课",
      lessonFile: "lesson38",
      description: "大家的日语第38课"
    },
    {
      courseNumber: 44,
      courseTitle: "第44课",
      lessonFile: "lesson44",
      description: "大家的日语第44课"
    },
    {
      courseNumber: 45,
      courseTitle: "第45课",
      lessonFile: "lesson45",
      description: "大家的日语第45课"
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