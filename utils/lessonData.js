/**
 * N1 第1课随小程序提供，词库尚未发布或离线时也能学习。
 * 其他课程沿用原来的网络请求，保留调用方对响应和缓存的处理。
 */
const bundledLessons = {
  'https://xyy1090091952.github.io/MeowBread_database/try_n1/lesson1.json':
    require('../database/try_n1/lesson1.js'),
};

function requestLesson(options) {
  if (!hasBundledLesson(options.url)) {
    return wx.request(options);
  }

  // 与 wx.request 一样在当前同步调用结束后通知调用方。
  Promise.resolve().then(() => {
    const response = { statusCode: 200, data: bundledLessons[options.url] };
    if (options.success) options.success(response);
    if (options.complete) options.complete(response);
  });
}

function hasBundledLesson(url) {
  return Object.prototype.hasOwnProperty.call(bundledLessons, url);
}

module.exports = { requestLesson, hasBundledLesson };
