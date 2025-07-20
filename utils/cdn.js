// CDN配置管理 - 喵面包日语学习小程序
// 主人，这里是我们的图片CDN配置哦～(◕‿◕)♡

// 基础配置
const CDN_CONFIG = {
  // 你的GitHub用户名（主人记得替换成你的哦～）
  username: 'YOUR_GITHUB_USERNAME',
  
  // 仓库名称（就是你现在这个小程序的仓库名）
  repo: 'YOUR_REPO_NAME',
  
  // 资源分支（我们可以用main分支，或者创建专门的cdn分支）
  branch: 'main',
  
  // CDN资源目录（在仓库中的路径）
  assetsPath: 'cdn-assets',
  
  // jsDelivr CDN基础URL
  baseUrl: 'https://cdn.jsdelivr.net/gh'
};

// 生成CDN链接的函数
function getCDNUrl(imagePath) {
  const { username, repo, branch, assetsPath, baseUrl } = CDN_CONFIG;
  return `${baseUrl}/${username}/${repo}@${branch}/${assetsPath}/${imagePath}`;
}

// 图片路径映射表
const IMAGE_PATHS = {
  // Banner相关图片
  banner: {
    arrow: 'banner/arrow.svg',
    banner1: 'https://free.picui.cn/free/2025/07/20/687bd6a330b7c.jpg',
    bigbread: 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png',
    click: 'banner/click.svg',
    gashapon: 'https://free.picui.cn/free/2025/07/20/687bd6a34f3f3.jpg',
    loginBg: 'https://free.picui.cn/free/2025/07/20/687bd6a37856d.jpg',
    meowBreadBanner: 'banner/Meow-Bread-banner.svg',
    meowBread: 'banner/Meow-Bread.svg',
    smallBread: 'https://free.picui.cn/free/2025/07/20/687bd6a37f4b4.png',
    whiteBread: 'banner/white-Bread.svg'
  },
  
  // 教材封面图片
  book: {
    dajia1: 'https://free.picui.cn/free/2025/07/20/687bd47160e75.jpg',
    dajia2: 'https://free.picui.cn/free/2025/07/20/687bd4713099b.jpg',
    duolingguo: 'https://free.picui.cn/free/2025/07/20/687bd47111ec1.jpg',
    liang: 'https://free.picui.cn/free/2025/07/20/687bd4712b75f.jpg',
    liang2: 'https://free.picui.cn/free/2025/07/20/687bd4715697e.jpg'
  },
  
  // 卡片图片
  card: {
    n5Card1: 'https://free.picui.cn/free/2025/07/20/687bd36a16e2b.jpg',
    n5Card2: 'https://free.picui.cn/free/2025/07/20/687bd36a6ae61.jpg',
    n5Card3: 'https://free.picui.cn/free/2025/07/20/687bd36b17b24.jpg',
    n5Card4: 'https://free.picui.cn/free/2025/07/20/687bd369ca8a1.jpg',
    n5Card5: 'https://free.picui.cn/free/2025/07/20/687bd36b8b0c7.jpg',
    n5Card6: 'https://free.picui.cn/free/2025/07/20/687bd36cedd17.jpg'
  },
  
  // 扭蛋机图片
  gashapon: {
    machine: 'https://free.picui.cn/free/2025/07/20/687bd7c226b4e.png',
    magic: 'https://free.picui.cn/free/2025/07/20/687bd7c1b8eae.png',
    energy: 'gashapon/enegy.png',
    shinning: 'gashapon/shinning.svg'
  },
  
  // 图标
  icons: {
    arrowRight: 'icons/arrow_right.svg',
    change: 'icons/change.png',
    coins: 'icons/Coins.png',
    highlightOff: 'icons/highlight_off.png',
    highlightOn: 'icons/highlight_on.png',
    timer: 'icons/timericon.png'
  },
  
  // 结果页图片
  result: {
    noob: 'result/noob.png',
    normal: 'result/normal.png',
    perfect: 'result/perfect.png'
  },
  
  // 标签栏图标
  tab: {
    answer: 'tab/answer.png',
    answerSelected: 'tab/answer_selected.png',
    knowledge: 'tab/knowledge.png',
    knowledgeSelected: 'tab/knowledge_selected.png',
    profile: 'tab/profile.png',
    profileSelected: 'tab/profile_selected.png',
    vocabulary: 'tab/vocabulary.png',
    vocabularySelected: 'tab/vocabulary_selected.png'
  }
};

// 获取图片CDN链接的便捷方法
const getImageUrl = {
  // Banner图片
  banner: (name) => getCDNUrl(IMAGE_PATHS.banner[name]),
  
  // 教材图片
  book: (name) => getCDNUrl(IMAGE_PATHS.book[name]),
  
  // 卡片图片
  card: (name) => getCDNUrl(IMAGE_PATHS.card[name]),
  
  // 扭蛋机图片
  gashapon: (name) => getCDNUrl(IMAGE_PATHS.gashapon[name]),
  
  // 图标
  icon: (name) => getCDNUrl(IMAGE_PATHS.icons[name]),
  
  // 结果页图片
  result: (name) => getCDNUrl(IMAGE_PATHS.result[name]),
  
  // 标签栏图标
  tab: (name) => getCDNUrl(IMAGE_PATHS.tab[name])
};

// 导出配置和方法
module.exports = {
  CDN_CONFIG,
  getCDNUrl,
  IMAGE_PATHS,
  getImageUrl
};

// 使用示例：
// const { getImageUrl } = require('./utils/cdn.js');
// 
// // 在页面中使用
// data: {
//   bigBreadUrl: getImageUrl.banner('bigbread'),
//   logoUrl: getImageUrl.banner('meowBread')
// }