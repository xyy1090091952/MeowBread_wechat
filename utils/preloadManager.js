// utils/preloadManager.js
// 资源预加载管理器 - 统一管理需要提前加载的资源，提升用户体验 ✨

// 导入奖品配置文件，从中获取图片数据
const { PrizeDataManager } = require('../data/gashapon-prizes-config.js');

/**
 * @description 预加载扭蛋机相关的图片资源
 * 该函数会获取所有奖品的图片和横幅图片，并使用 wx.getImageInfo 进行预加载。
 * 这样可以确保在用户访问扭蛋机或陈列馆页面时，图片能够从缓存中快速加载，提升用户体验。
 * @param {Function} [callback] - 可选的回调函数，在所有图片尝试加载后执行。
 */
const preloadGashaponImages = (callback) => {
  // 通过数据管理器获取所有系列的数据
  const allSeries = PrizeDataManager.getAllSeries();
  const imageUrls = new Set(); // 使用 Set 数据结构来存储图片URL，可以自动去重

  // 遍历所有系列和其中的奖品，收集所有需要预加载的图片URL
  allSeries.forEach(series => {
    series.prizes.forEach(prize => {
      // 添加奖品的预览图 (image)
      if (prize.image) {
        imageUrls.add(prize.image);
      }
      // 添加奖品的横幅图 (bannerImage)
      if (prize.bannerImage) {
        imageUrls.add(prize.bannerImage);
      }
      // 如果奖品有关联的粒子效果，并且效果图不是SVG格式，也进行预加载
      if (prize.particleConfig && prize.particleConfig.image && !prize.particleConfig.image.endsWith('.svg')) {
          imageUrls.add(prize.particleConfig.image);
      }
    });
  });

  // 将Set转换为数组，方便遍历
  const imageUrlList = Array.from(imageUrls);
  let loadedCount = 0;
  const totalCount = imageUrlList.length;

  // 如果没有需要加载的图片，直接返回
  if (totalCount === 0) {
    console.log('没有需要预加载的扭蛋图片。');
    if (callback) callback();
    return;
  }

  console.log(`检测到 ${totalCount} 张扭蛋图片，开始预加载...`);

  // 遍历图片URL列表，调用 wx.getImageInfo 进行预加载
  imageUrlList.forEach(url => {
    // wx.getImageInfo 不支持处理 SVG 格式，因此跳过所有.svg文件
    if (typeof url === 'string' && url.endsWith('.svg')) {
        console.log(`跳过 SVG 预加载: ${url}`);
        loadedCount++;
        // 如果这是最后一张，执行回调
        if (loadedCount === totalCount && callback) {
            callback();
        }
        return;
    }

    wx.getImageInfo({
      src: url, // 图片的URL
      success: (res) => {
        // 预加载成功，图片已缓存。这里不做额外操作，静默处理。
        // console.log(`图片预加载成功: ${url}`);
      },
      fail: (err) => {
        // 预加载失败，可能是链接错误或网络问题。同样静默处理，避免干扰主流程。
        // console.warn(`图片预加载失败: ${url}`, err);
      },
      complete: () => {
        // 无论成功或失败，都将计数器加一
        loadedCount++;
        // 当所有图片都处理完毕后（无论成功与否），打印日志并执行回调
        if (loadedCount === totalCount) {
          console.log('所有扭蛋图片已尝试预加载完毕。');
          if (callback) {
            callback();
          }
        }
      }
    });
  });
};

// 导出预加载函数，以便在 app.js 中调用
module.exports = {
  preloadGashaponImages
};