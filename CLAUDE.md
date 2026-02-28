# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 构建与开发

```bash
npm run dev          # webpack-dev-server，端口 4060
npm run build        # 生产环境构建，输出到 dist/
```

未配置测试框架，未配置 linter 或代码格式化工具。

## 架构

这是一个基于 Three.js 和原生 JS（无框架）构建的 **3D 太阳系可视化** 项目。README 中提到了 Vue3，但当前 `onlyWebpack` 分支使用纯 DOM 操作实现所有 UI。

**打包工具**：Webpack 5 + Babel。由于 Node 16 的 `crypto.getRandomValues` 兼容性问题，从 Vite 迁移而来。

### 入口与初始化 (`src/index.js`)

顶层 await 按顺序加载所有内容：
1. 初始化 Three.js 核心（renderer、camera、scene、controls）
2. 加载环境贴图（EXR）和天空球纹理（JPG）
3. 加载太阳 + 全部 8 颗行星（GLTF 模型异步加载）
4. 配置射线拾取（raycaster）、后处理（选择性辉光 bloom）和事件监听
5. 启动 `animate()` 循环

### Three.js 对象层级（每颗行星）

每颗行星使用 3 层 Group 嵌套，实现独立变换：
```
[planet]Axis (Group)    → 轨道倾角
  └─ [planet]Root       → 公转（轨道位置）
       └─ [planet]Spin  → 自转
            └─ model    → GLTF 场景
```

### 渲染管线

每帧执行：
1. 更新悬停状态机 (`tickHover`)
2. 检查聚焦状态 - 若已聚焦，跳过悬停检测
3. 更新行星公转（悬停时冻结）和自转
4. **选择性辉光**：将所有非太阳对象变暗 → 渲染辉光合成器 → 恢复材质 → 渲染最终合成器（叠加混合）

图层系统：Layer 1 = 辉光（仅太阳），Layer 2 = 外行星补光（木星、土星、天王星、海王星）。

### 悬停交互状态机 (`src/interaction/hover.js`)

最复杂的子系统。四个阶段：`idle` → `body` → `sticky` → `label`。

- **body**：射线命中行星网格
- **sticky**：鼠标离开行星但仍在环形"粘滞区域"内（距投影边缘 24-36px）。有计时规则：`minHoldMs`（300ms）防止过早退出，`expireMs`（1500ms）强制退出
- **label**：鼠标悬停在 DOM 标签元素上或附近。使用滞回机制（进入阈值 8px，退出阈值 14px）防止闪烁

行星聚焦时完全抑制悬停。状态机图表见 `/doc/` 目录。

### 聚焦系统 (`src/interaction/focus.js`)

点击行星 → 相机动画移动，将行星定位在屏幕右半部分（左侧显示面板）。使用自定义二次缓入缓出动画，持续 0.6 秒。动画期间锁定 OrbitControls。

### 关键约定

- **可拾取网格**：每颗行星导出 `pickableMeshes`。网格通过 `userData.anchorPointName` 配合 `findAncestorByName()` 追溯到祖先 Group。
- **模块级状态**：无集中式状态管理。每个模块导出自己的状态和更新函数。
- **静态资源**：静态文件位于 `/assets/`（非 `public/assets/`），通过 webpack `devServer.static` 配置提供服务。GLTF 模型路径为 `assets/[planet-name]/scene.gltf`。
- **CSS**：16 个独立 CSS 文件在 `src/index.js` 中导入。科幻主题风格，使用 SVG 渐变边框。样式文件位于 `assets/css/`。

### 添加新行星

参照任意已有行星文件的模式（如 `src/planet/earth.js`）：
1. 创建 `src/planet/[name].js`，包含 axis/root/spin Groups、GLTF 加载和轨道参数
2. 导出 `init[Name]()`、`update[Name]()`、`[name]Axis` 和 `pickableMeshes`
3. 在 `src/index.js` 中：导入模块，调用 init，添加到场景，在 `animate()` 中添加更新调用，注册可拾取网格
4. 若为外行星：添加到 `outerPlants` 数组以启用 Layer 2 补光