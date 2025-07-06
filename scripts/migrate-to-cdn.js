// 图片迁移到CDN的批处理脚本
// 主人，这个脚本帮你把本地图片迁移到CDN结构中～(◕‿◕)♡

const fs = require('fs');
const path = require('path');

// 源图片目录和目标CDN目录
const SOURCE_DIR = './images';
const CDN_DIR = './cdn-assets';

// 创建CDN目录结构
function createCDNDirectories() {
  const directories = [
    'banner',
    'book', 
    'card',
    'icons',
    'result',
    'tab'
  ];
  
  // 创建主CDN目录
  if (!fs.existsSync(CDN_DIR)) {
    fs.mkdirSync(CDN_DIR);
    console.log(`✅ 创建CDN目录: ${CDN_DIR}`);
  }
  
  // 创建子目录
  directories.forEach(dir => {
    const dirPath = path.join(CDN_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
      console.log(`✅ 创建子目录: ${dirPath}`);
    }
  });
}

// 复制图片文件
function copyImages() {
  try {
    // 复制banner目录
    if (fs.existsSync(path.join(SOURCE_DIR, 'banner'))) {
      copyDirectory(path.join(SOURCE_DIR, 'banner'), path.join(CDN_DIR, 'banner'));
    }
    
    // 复制book目录
    if (fs.existsSync(path.join(SOURCE_DIR, 'book'))) {
      copyDirectory(path.join(SOURCE_DIR, 'book'), path.join(CDN_DIR, 'book'));
    }
    
    // 复制card目录
    if (fs.existsSync(path.join(SOURCE_DIR, 'card'))) {
      copyDirectory(path.join(SOURCE_DIR, 'card'), path.join(CDN_DIR, 'card'));
    }
    
    // 复制icons目录
    if (fs.existsSync(path.join(SOURCE_DIR, 'icons'))) {
      copyDirectory(path.join(SOURCE_DIR, 'icons'), path.join(CDN_DIR, 'icons'));
    }
    
    // 复制result目录
    if (fs.existsSync(path.join(SOURCE_DIR, 'result'))) {
      copyDirectory(path.join(SOURCE_DIR, 'result'), path.join(CDN_DIR, 'result'));
    }
    
    // 复制tab目录
    if (fs.existsSync(path.join(SOURCE_DIR, 'tab'))) {
      copyDirectory(path.join(SOURCE_DIR, 'tab'), path.join(CDN_DIR, 'tab'));
    }
    
    console.log('🎉 所有图片迁移完成！');
  } catch (error) {
    console.error('❌ 迁移过程中出错:', error);
  }
}

// 复制目录的辅助函数
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`📁 复制文件: ${srcPath} → ${destPath}`);
    }
  });
}

// 生成使用说明
function generateUsageGuide() {
  const guide = `
# CDN图片迁移完成指南 🎯

## 下一步操作：

### 1. 提交到Git仓库 📤
\`\`\`bash
git add cdn-assets/
git commit -m "add: CDN资源目录和图片文件"
git push origin main
\`\`\`

### 2. 更新CDN配置 ⚙️
编辑 utils/cdn.js 文件，替换以下配置：
- username: '你的GitHub用户名'
- repo: '你的仓库名'

### 3. 测试CDN链接 🔗
等待2-3分钟后，你的CDN链接应该是这样的：
https://cdn.jsdelivr.net/gh/你的用户名/你的仓库名@main/cdn-assets/banner/bigbread.png

### 4. 更新页面引用 🔄
在页面JS文件中引入CDN配置：
\`\`\`javascript
const { getImageUrl } = require('../../utils/cdn.js');

Page({
  data: {
    bigBreadUrl: getImageUrl.banner('bigbread')
  }
});
\`\`\`

### 5. 验证和清理 ✨
确认CDN工作正常后，可以考虑删除原有的images目录以节省空间。

主人加油哦～(◕‿◕)♡
`;
  
  fs.writeFileSync('./CDN迁移指南.md', guide);
  console.log('📖 已生成使用指南: CDN迁移指南.md');
}

// 执行迁移
console.log('🚀 开始迁移图片到CDN结构...');
createCDNDirectories();
copyImages();
generateUsageGuide();
console.log('✨ 迁移完成！请查看 CDN迁移指南.md 了解下一步操作～'); 