# 图片资源预加载与缓存系统 PRD

> **版本历史**
>
> | 版本 | 日期       | 作者 | 备注     |
> | ---- | ---------- | ---- | -------- |
> | V1.0 | 2023-08-16 | Gemini | 创建初始文档 |

---

## 1. 需求背景

目前，「喵喵单词」小程序内各页面所使用的图片资源（如背景图、图标、banner等）均采用在线链接方式引入。这导致在每次进入相关页面时，都需要临时从网络下载图片，在网络状况不佳时会造成明显的延迟和卡顿，影响了用户的流畅体验。

为了优化用户体验，减少不必要的网络请求和加载等待，我们计划引入一套图片预加载与缓存机制。

## 2. 需求目标

1.  **提升加载速度**：在小程序启动时预先下载必要的图片资源，当用户访问到相关页面时，图片能够瞬时加载，实现“零延迟”的视觉体验。
2.  **优化网络资源使用**：实现图片的本地缓存。对于已下载的图片，不再重复发起网络请求，节省用户流量，并减轻服务器压力。
3.  **提供透明的缓存管理**：在现有的“缓存管理”页面中，增加对图片缓存的管理功能，让用户可以直观地看到缓存数量并能手动清理，保证应用的透明度和用户的自主权。

## 3. 功能详述

### 3.1 图片资源清单

我们通过扫描整个小程序代码库，整理出以下所有通过网络链接加载的图片资源。这些资源将全部纳入预加载和缓存的管理范围。

*   `https://free.picui.cn/free/2025/07/20/687bd36a16e2b.jpg`
*   `https://free.picui.cn/free/2025/07/20/687bd36a6ae61.jpg`
*   `https://free.picui.cn/free/2025/07/20/687bd36b17b24.jpg`
*   `https://free.picui.cn/free/2025/07/20/687bd369ca8a1.jpg`
*   `https://free.picui.cn/free/2025/07/20/687bd36b8b0c7.jpg`
*   `https://free.picui.cn/free/2025/07/20/687bd36cedd17.jpg`
*   `https://free.picui.cn/free/2025/07/27/6885dd53087dd.png`
*   `https://free.picui.cn/free/2025/07/20/687cec7e7d209.png`
*   `https://free.picui.cn/free/2025/07/20/687cec7e5578f.png`
*   `https://free.picui.cn/free/2025/07/20/687cec7e5cf3a.png`
*   `https://free.picui.cn/free/2025/07/26/6883c5e4b8633.jpg`
*   `https://free.picui.cn/free/2025/07/26/6883c5e48d352.jpg`
*   `https://free.picui.cn/free/2025/07/26/6883c5e44f3af.png`
*   `https://free.picui.cn/free/2025/07/20/687bd7c1b8eae.png`
*   `https://free.picui.cn/free/2025/07/27/688635c415308.png`
*   `https://free.picui.cn/free/2025/07/27/6885d7ecf3f07.png`
*   `https://free.picui.cn/free/2025/07/27/6885d8248ac68.png`
*   `https://free.picui.cn/free/2025/07/20/687cf854d8832.png`
*   `https://free.picui.cn/free/2025/07/20/687cf8549c6f3.png`
*   `https://free.picui.cn/free/2025/07/20/687cf854dc136.png`
*   `https://free.picui.cn/free/2025/07/20/687cf854b2086.png`
*   `https://free.picui.cn/free/2025/07/20/687cf85670845.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd5ac4046.png`
*   `https://free.picui.cn/free/2025/07/20/687cf856f3a00.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd5943fd9.png`
*   `https://free.picui.cn/free/2025/07/27/6885d2800695d.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd57eb086.png`
*   `https://free.picui.cn/free/2025/07/20/687cf85828beb.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd55f2f34.png`
*   `https://free.picui.cn/free/2025/07/20/687cf857e63ae.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd5788c62.png`
*   `https://free.picui.cn/free/2025/07/27/6885d2800b9d2.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd57dbe8a.png`
*   `https://free.picui.cn/free/2025/07/20/687cf859a87a4.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd52e7d20.png`
*   `https://free.picui.cn/free/2025/07/20/687cf8593a21e.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd52e796f.png`
*   `https://free.picui.cn/free/2025/07/20/687cf85854f37.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd52cccb8.png`
*   `https://free.picui.cn/free/2025/07/27/6885d280077fe.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd52d6751.png`
*   `https://free.picui.cn/free/2025/07/27/6885e1fc7a357.png`
*   `https://free.picui.cn/free/2025/07/27/6885dd55b5df8.png`

> **注意**: 此列表通过扫描代码库自动生成，确保了全面性。后续新增的图片资源也需要同步更新到此清单中，并纳入缓存管理。

### 3.2 预加载机制

1.  **触发时机**：小程序冷启动时，在 `app.js` 的 `onLaunch`生命周期函数中执行预加载任务。
2.  **执行逻辑**：
    *   启动后，系统检查预加载图片列表。
    *   逐一判断每张图片是否已存在本地缓存。
    *   若缓存不存在，则调用 `wx.downloadFile` 接口下载图片，并将其保存到小程序的本地用户文件目录中。
    *   为了不阻塞小程序的启动流程，预加载任务应在后台静默执行。

### 3.3 缓存策略

1.  **缓存管理模块**：
    *   在 `utils` 目录下新建一个 `imageManager.js` 模块，统一负责图片的加载、缓存获取、缓存清理等所有相关逻辑。
    *   该模块将维护一个图片URL到本地缓存路径的映射表（可以通过 `wx.setStorageSync` / `wx.getStorageSync` 实现）。
2.  **图片加载逻辑**：
    *   小程序内所有需要显示网络图片的地方，都应通过 `imageManager.js` 提供的接口来获取图片路径。
    *   接口逻辑：接收一个图片URL -> 查询映射表 -> 若存在本地路径，则直接返回；若不存在，则先下载、缓存，再返回新缓存的本地路径。
3.  **缓存替换方案：`<cached-image>` 组件**
    *   为了实现最佳的代码复用和可维护性，我们将创建一个独立的自定义组件 `<cached-image>` 来取代全局直接替换图片加载方式的方案。
    *   该组件将内部集成 `imageManager.js` 的所有逻辑，开发者只需传入原始的图片URL即可。
    *   **样式兼容性**：为了解决您担心的CSS样式问题，该组件将设计为“样式透明”。它会通过 `externalClasses` 接受外部传入的CSS类，并将其直接应用到内部的 `<image>` 标签上。同时，它也会支持传入 `mode` 等原生 `image` 组件的属性。
    *   **异常处理与占位符**：
        *   **占位图**：在图片处于下载过程或因网络问题、URL失效等原因下载失败时，组件将显示一张统一的默认占位图（例如：一个灰色的图片框或加载中图标）。这可以避免因图片加载失败导致的页面空白或布局抖动，保证视觉一致性。
        *   **失败重试**：当图片下载失败时，系统将自动尝试重新下载1次。如果依然失败，则会显示“加载失败”的占位图。
    *   **使用示例**：
        ```html
        <!-- Before -->
        <image class="my-custom-style" src="https://example.com/image.png" mode="aspectFill"></image>

        <!-- After -->
        <cached-image custom-class="my-custom-style" original-src="https://example.com/image.png" mode="aspectFill"></cached-image>
        ```
        这样，页面的样式代码几乎无需改动，极大地降低了迁移成本。

### 3.4 缓存管理页面 (`pages/cache-manager`)

1.  **界面更新**：
    *   在现有缓存详情中，分别展示“单词缓存”和“图片缓存”的统计信息，包括各自的数量和占用的存储空间大小。
    *   页面顶部的“总缓存数”和“总占用空间”将显示为单词和图片缓存之和。
2.  **功能更新**：
    *   现有的「清理所有缓存」按钮功能将得到扩展，能够同时清理所有的单词缓存和图片缓存。
    *   点击该按钮后，系统将调用 `wordManager.js` 和 `imageManager.js` 中的清理方法，一并清空两种类型的缓存。
    *   清理完成后，页面上的所有统计数据（单词、图片及总计）都将归零。

## 4. 技术方案与开发规划

### 4.1 技术要点

*   **文件系统**: 使用 `wx.getFileSystemManager()` 来进行文件的保存、删除和信息获取。
*   **网络请求**: 使用 `wx.downloadFile()` 下载图片资源。
*   **本地存储**: 使用 `wx.setStorageSync` 和 `wx.getStorageSync` 来管理图片URL与本地路径的映射关系。
*   **自定义组件**: 使用 `Component` 构造器创建 `<cached-image>` 组件，并通过 `externalClasses` 保证样式兼容性。

### 4.2 开发任务拆解

| 任务ID | 任务名称                               | 模块/页面                                | 预估工时 | 优先级 |
| ------ | -------------------------------------- | ---------------------------------------- | -------- | ------ |
| T1     | 创建 `imageManager.js` 缓存管理模块    | `utils/imageManager.js`                  | 4小时    | 高     |
| T2     | 实现图片下载、保存与路径映射功能       | `utils/imageManager.js`                  | 6小时    | 高     |
| T3     | 在 `app.js` 中集成预加载逻辑           | `app.js`                                 | 2小时    | 高     |
| T4     | 创建 `<cached-image>` 自定义组件       | `components/cached-image/`               | 5小时    | 高     |
| T5     | 全局使用 `<cached-image>` 替换原生标签 | 所有使用网络图片的页面和组件             | 6小时    | 中     |
| T6     | 改造 `cache-manager` 页面              | `pages/cache-manager/`                   | 4小时    | 高     |
| T7     | 实现图片缓存统计与清理功能             | `utils/imageManager.js`, `pages/cache-manager/` | 3小时    | 高     |
| T8     | 联调测试与体验优化                     | 整个小程序                               | 4小时    | 高     |

## 5. 未来规划 (Future Considerations)

为了确保产品的长期健康和可扩展性，我们预见以下几点可作为未来版本的优化方向：

*   **缓存淘汰策略**：当前方案会永久缓存所有下载过的图片。在未来，当缓存占用的存储空间达到一定阈值时（例如50MB），可以引入LRU (Least Recently Used) 缓存淘汰算法，自动清理那些最久未被使用的图片缓存，从而有效控制小程序的存储占用。
*   **智能化预加载**：当前的预加载机制是在小程序启动时加载所有清单内的图片。未来可以结合用户行为数据分析，实现更智能的预加载策略。例如，优先加载用户上一次学习章节的相关图片，或者预测用户最可能点击的下一个页面的资源，从而将网络资源用在“刀刃”上。

---
**下一步**:
待产品经理（您）确认此份PRD后，即可进入开发阶段。