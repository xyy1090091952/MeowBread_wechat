// utils/imageManager.js

/**
 * @file 图片缓存管理器
 * @description 负责小程序中网络图片的下载、缓存、获取及清理，旨在优化图片加载性能和用户体验。
 */

// 获取微信小程序的文件系统管理器
const fs = wx.getFileSystemManager();
// 定义图片缓存目录路径
const CACHE_DIR = wx.env.USER_DATA_PATH + '/image_cache';

// 用于存储图片URL与本地缓存路径映射的Storage Key
const CACHE_MAP_KEY = 'image_cache_map';

// 缓存映射对象，用于在内存中快速查找，避免频繁读写Storage
let cacheMap = {};

/**
 * 初始化图片管理器
 * @description 在小程序启动时调用，确保缓存目录存在，并从Storage中加载缓存映射表到内存。
 */
const init = () => {
  try {
    // 尝试从本地存储中同步获取缓存映射表
    cacheMap = wx.getStorageSync(CACHE_MAP_KEY) || {};
    // 使用同步方法检查并创建缓存目录，防止因异步导致后续操作失败
    try {
      fs.accessSync(CACHE_DIR);
      console.log('[ImageManager] 图片缓存目录已存在');
    } catch (e) {
      // 如果目录不存在，accessSync会抛出异常
      console.log('[ImageManager] 图片缓存目录不存在，开始创建...');
      try {
        fs.mkdirSync(CACHE_DIR, true);
        console.log('[ImageManager] 图片缓存目录创建成功');
      } catch (mkdirErr) {
        console.error('[ImageManager] 创建缓存目录失败', mkdirErr);
      }
    }
  } catch (e) {
    console.error('[ImageManager] 初始化图片缓存失败', e);
    cacheMap = {};
  }
};

/**
 * 根据图片URL获取本地缓存路径
 * @param {string} url - 原始图片URL
 * @returns {Promise<string>} 返回一个Promise，成功时解析为本地缓存路径，失败时拒绝并返回错误信息。
 */
const getImagePath = (url) => {
  return new Promise((resolve, reject) => {
    // 校验URL的有效性
    if (!url || typeof url !== 'string') {
      return reject('无效的图片URL');
    }

    // 1. 检查内存中的缓存映射
    if (cacheMap[url]) {
      const localPath = cacheMap[url];
      // 2. 确认本地文件是否真实存在，防止被手动删除
      fs.access({
        path: localPath,
        success: () => {
          // 缓存有效，直接返回本地路径
          console.log(`[ImageManager] 缓存命中: ${url}`);
          resolve(localPath);
        },
        fail: () => {
          // 缓存记录存在但文件丢失，当作未缓存处理
          console.warn(`[ImageManager] 缓存失效，文件不存在: ${localPath}，重新下载...`);
          delete cacheMap[url]; // 从内存中移除无效记录
          downloadAndCacheImage(url).then(resolve).catch(reject);
        }
      });
    } else {
      // 3. 内存中无缓存记录，执行下载
      console.log(`[ImageManager] 缓存未命中: ${url}，开始下载...`);
      downloadAndCacheImage(url).then(resolve).catch(reject);
    }
  });
};

/**
 * 下载并缓存单张图片
 * @private
 * @param {string} url - 图片URL
 * @returns {Promise<string>} 成功则解析为本地文件路径
 */
const downloadAndCacheImage = (url) => {
  return new Promise((resolve, reject) => {
    // 根据URL生成一个合法且唯一的文件名
    const fileName = url.replace(/[\/\:\*\?"<>\|]/g, '_');
    const filePath = `${CACHE_DIR}/${fileName}`;

    wx.downloadFile({
      url: url,
      filePath: filePath, // 直接下载到永久文件路径
      success: (res) => {
        if (res.statusCode === 200) {
          console.log(`[ImageManager] 图片下载并保存成功: ${filePath}`);
          // 更新缓存映射
          cacheMap[url] = filePath;
          // 将更新后的映射表异步写入本地存储
          wx.setStorage({ key: CACHE_MAP_KEY, data: cacheMap });
          resolve(filePath);
        } else {
          console.error(`[ImageManager] 图片下载失败，状态码: ${res.statusCode}`, res);
          reject(res);
        }
      },
      fail: (downloadErr) => {
        console.error('[ImageManager] 图片下载请求失败', downloadErr);
        reject(downloadErr);
      }
    });
  });
};

/**
 * 预加载图片列表
 * @description 遍历URL列表，静默触发下载和缓存，不阻塞主流程。
 * @param {Array<string>} urls - 需要预加载的图片URL数组
 */
const preloadImages = (urls) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    console.log('[ImageManager] 预加载列表为空，跳过预加载。');
    return;
  }

  console.log(`[ImageManager] 开始预加载 ${urls.length} 张图片...`);
  urls.forEach(url => {
    // 调用getImagePath会触发缓存检查和按需下载
    // 我们在这里不需要关心它的返回值，因为它会在后台完成所有工作
    // 通过.catch捕获并打印潜在的错误，避免预加载失败影响其他逻辑
    getImagePath(url).catch(err => {
      console.warn(`[ImageManager] 预加载失败: ${url}`, err);
    });
  });
};

/**
 * 获取缓存统计信息
 * @returns {Promise<object>} 返回一个Promise，成功时解析为包含{count, size}的对象。
 */
const getCacheStats = () => {
  return new Promise((resolve, reject) => {
    const count = Object.keys(cacheMap).length;
    if (count === 0) {
      return resolve({ count: 0, size: 0 });
    }

    fs.readdir({
      dirPath: CACHE_DIR,
      success: (res) => {
        let totalSize = 0;
        const fileList = res.files;
        if (fileList.length === 0) {
          return resolve({ count: 0, size: 0 });
        }
        let processed = 0;
        fileList.forEach(fileName => {
          fs.getFileInfo({
            filePath: `${CACHE_DIR}/${fileName}`,
            success: (infoRes) => {
              totalSize += infoRes.size;
              processed++;
              if (processed === fileList.length) {
                resolve({ count: count, size: totalSize });
              }
            },
            fail: (err) => {
              processed++;
              if (processed === fileList.length) {
                resolve({ count: count, size: totalSize });
              }
            }
          });
        });
      },
      fail: (err) => {
        // 如果读取目录失败，可能目录不存在，此时缓存为0
        if (err.errMsg.includes('no such file or directory')) {
          resolve({ count: 0, size: 0 });
        } else {
          reject(err);
        }
      }
    });
  });
};

/**
 * 清理所有图片缓存
 * @returns {Promise<void>} 返回一个Promise，在清理完成后解析。
 */
const clearAllCache = () => {
  return new Promise((resolve, reject) => {
    // 1. 清空内存缓存
    cacheMap = {};

    // 2. 异步清空Storage
    wx.removeStorage({ key: CACHE_MAP_KEY });

    // 3. 删除并重建缓存目录
    fs.rmdir({
      dirPath: CACHE_DIR,
      recursive: true, // 递归删除目录及其内容
      success: () => {
        console.log('[ImageManager] 缓存目录已成功删除');
        // 4. 重新创建空目录
        fs.mkdir({
          dirPath: CACHE_DIR,
          recursive: true,
          success: () => {
            console.log('[ImageManager] 缓存目录已重新创建');
            resolve();
          },
          fail: (err) => {
            console.error('[ImageManager] 重新创建缓存目录失败', err);
            reject(err);
          }
        });
      },
      fail: (err) => {
        // 如果目录不存在，也视为成功
        if (err.errMsg.includes('no such file or directory')) {
          console.log('[ImageManager] 缓存目录不存在，无需删除。');
          resolve();
        } else {
          console.error('[ImageManager] 删除缓存目录失败', err);
          reject(err);
        }
      }
    });
  });
};

// 模块初始化
init();

// 对外暴露接口
module.exports = {
  getImagePath,
  preloadImages,
  getCacheStats,
  clearAllCache
};